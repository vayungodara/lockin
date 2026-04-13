'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import { useModalScrollLock } from '@/lib/useModalScrollLock';
import { modalContent, buttonHover, buttonTap, fadeInUp } from '@/lib/animations';
import { PACT_TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/pactTemplates';
import styles from './CreatePactModal.module.css';

export default function CreatePactModal({ isOpen, onClose, onPactCreated }) {
  const [step, setStep] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeCategory, setActiveCategory] = useState('academics');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  const supabase = useMemo(() => createClient(), []);

  // Fix #11: Extracted resetFormState to eliminate 3x duplication
  const resetFormState = useCallback(() => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setDeadlineTime('23:59');
    setIsRecurring(false);
    setRecurrenceType('daily');
    setSelectedTemplate(null);
    setActiveCategory('academics');
    setError('');
    setStep('templates');
  }, []);

  // Fix #11: Use resetFormState in handleClose
  const handleClose = useCallback(() => {
    resetFormState();
    onClose();
  }, [onClose, resetFormState]);

  useModalScrollLock(isOpen);

  // Fix #2: Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Fix #3: Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      requestAnimationFrame(() => {
        const first = modalRef.current?.querySelector('button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
        first?.focus();
      });
    }
    return () => {
      if (previousFocusRef.current) previousFocusRef.current.focus();
    };
  }, [isOpen]);

  const filteredTemplates = useMemo(
    () => isOpen ? PACT_TEMPLATES.filter(t => t.category === activeCategory) : [],
    [activeCategory, isOpen]
  );

  // Get minimum date (today) and maximum date (1 year from today) — pinned when modal opens
  const today = useMemo(
    () => isOpen ? new Date().toISOString().split('T')[0] : '',
    [isOpen]
  );

  const maxDate = useMemo(() => {
    if (!isOpen) return '';
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    return oneYearFromNow.toISOString().split('T')[0];
  }, [isOpen]);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setDescription(template.description);
    setDeadline(today);
    setDeadlineTime(template.suggestedTime);
    setIsRecurring(template.isRecurring);
    setRecurrenceType(template.recurrenceType || 'daily');
    setStep('form');
  };

  // Fix #11: Use resetFormState then override step
  const handleStartFromScratch = () => {
    resetFormState();
    setStep('form');
  };

  const handleBack = () => {
    setStep('templates');
    setSelectedTemplate(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!title.trim()) {
      setError('Please enter a pact title');
      setIsLoading(false);
      return;
    }

    if (!deadline) {
      setError('Please select a deadline');
      setIsLoading(false);
      return;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        setError('You must be signed in to create a pact');
        setIsLoading(false);
        return;
      }

      // Combine date and time for deadline
      const deadlineDateTime = new Date(`${deadline}T${deadlineTime}`);

      if (deadlineDateTime < new Date()) {
        setError('Deadline must be in the future');
        setIsLoading(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from('pacts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          deadline: deadlineDateTime.toISOString(),
          status: 'active',
          is_recurring: isRecurring,
          recurrence_type: isRecurring ? recurrenceType : null
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      await logActivity(supabase, 'pact_created', null, { pact_description: data.title });

      // Fix #11: Use resetFormState in success path
      resetFormState();

      // Notify parent and close
      if (onPactCreated) {
        onPactCreated(data);
      }
      onClose();
    } catch (err) {
      // Fix #10: Generic error message
      console.error('Error creating pact:', err);
      setError('Failed to create pact. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fix #12: Removed unused recurrenceLabel function

  // Fix #13: Portal always renders, AnimatePresence controls visibility
  return (
    <>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div
              className={styles.overlay}
              onClick={handleClose}
            >
              <motion.div
                key="pact-modal"
                ref={modalRef}
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-pact-title"
                onClick={(e) => e.stopPropagation()}
                {...modalContent}
              >
              {/* Header */}
              <div className={styles.header}>
                <div className={styles.headerLeft}>
                  {step === 'form' && (
                    <motion.button
                      className={styles.backBtn}
                      onClick={handleBack}
                      whileHover={buttonHover}
                      whileTap={buttonTap}
                      aria-label="Back to templates"
                      {...fadeInUp}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.button>
                  )}
                  <div>
                    <h2 id="create-pact-title">{step === 'templates' ? 'New Pact' : 'Create New Pact'}</h2>
                    {step === 'templates' && (
                      <p className={styles.headerSubtitle}>Choose a template or start from scratch</p>
                    )}
                  </div>
                </div>
                <motion.button
                  className={styles.closeBtn}
                  onClick={handleClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>
              </div>

              {/* Step 1: Template Picker */}
              {step === 'templates' && (
                <div className={styles.templatePickerBody}>
                  {/* Category pills */}
                  <div className={styles.categoryPills}>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        className={`${styles.categoryPill} ${activeCategory === cat.id ? styles.categoryPillActive : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                        aria-pressed={activeCategory === cat.id}
                      >
                        {cat.emoji && <span>{cat.emoji}</span>}
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className={styles.templateGrid}>
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        className={styles.templateCard}
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <span className={styles.templateEmoji}>{template.emoji}</span>
                        <span className={styles.templateTitle}>{template.title}</span>
                      </button>
                    ))}
                  </div>

                  <motion.button
                    className={styles.scratchBtn}
                    onClick={handleStartFromScratch}
                    whileHover={buttonHover}
                    whileTap={buttonTap}
                    {...fadeInUp}
                  >
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Start from scratch
                  </motion.button>
                </div>
              )}

              {/* Step 2: Form */}
              {step === 'form' && (
                <form onSubmit={handleSubmit} className={styles.form}>
                  {selectedTemplate && (
                    <motion.div className={styles.templateBadge} {...fadeInUp}>
                      <span>{selectedTemplate.emoji}</span>
                      Based on {selectedTemplate.title}
                    </motion.div>
                  )}

                  <div className={styles.inputGroup}>
                    <label htmlFor="title" className={styles.label}>
                      What are you committing to?
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Finish reading Chapter 5"
                      className={styles.input}
                      maxLength={200}
                      autoFocus
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="description" className={styles.label}>
                      Details (optional)
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Any additional context or notes..."
                      className={styles.textarea}
                      rows={3}
                      maxLength={1000}
                    />
                  </div>

                  <div className={styles.deadlineRow}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="deadline" className={styles.label}>
                        Deadline Date
                      </label>
                      <input
                        type="date"
                        id="deadline"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        min={today}
                        max={maxDate}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor="deadlineTime" className={styles.label}>
                        Time
                      </label>
                      <input
                        type="time"
                        id="deadlineTime"
                        value={deadlineTime}
                        onChange={(e) => setDeadlineTime(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.recurringSection}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 1L21 5L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 11V9C3 7.93913 3.42143 6.92172 4.17157 6.17157C4.92172 5.42143 5.93913 5 7 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7 23L3 19L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 13V15C21 16.0609 20.5786 17.0783 19.8284 17.8284C19.0783 18.5786 18.0609 19 17 19H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Make this a recurring pact
                      </span>
                    </label>

                    <AnimatePresence>
                      {isRecurring && (
                        <motion.div
                          className={styles.recurrenceOptions}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className={styles.recurrenceButtons}>
                            <button
                              type="button"
                              className={`${styles.recurrenceBtn} ${recurrenceType === 'daily' ? styles.active : ''}`}
                              onClick={() => setRecurrenceType('daily')}
                              aria-pressed={recurrenceType === 'daily'}
                            >
                              Daily
                            </button>
                            <button
                              type="button"
                              className={`${styles.recurrenceBtn} ${recurrenceType === 'weekly' ? styles.active : ''}`}
                              onClick={() => setRecurrenceType('weekly')}
                              aria-pressed={recurrenceType === 'weekly'}
                            >
                              Weekly
                            </button>
                            <button
                              type="button"
                              className={`${styles.recurrenceBtn} ${recurrenceType === 'weekdays' ? styles.active : ''}`}
                              onClick={() => setRecurrenceType('weekdays')}
                              aria-pressed={recurrenceType === 'weekdays'}
                            >
                              Weekdays
                            </button>
                            <button
                              type="button"
                              className={`${styles.recurrenceBtn} ${recurrenceType === 'monthly' ? styles.active : ''}`}
                              onClick={() => setRecurrenceType('monthly')}
                              aria-pressed={recurrenceType === 'monthly'}
                            >
                              Monthly
                            </button>
                          </div>
                          <p className={styles.recurrenceHint}>
                            {recurrenceType === 'daily' && 'This pact will repeat every day'}
                            {recurrenceType === 'weekly' && 'This pact will repeat every week on the same day'}
                            {recurrenceType === 'weekdays' && 'This pact will repeat Monday through Friday'}
                            {recurrenceType === 'monthly' && 'This pact will repeat every month on the same date'}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        className={styles.error}
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={styles.actions}>
                    <motion.button
                      type="button"
                      onClick={handleClose}
                      className={styles.cancelBtn}
                      whileHover={buttonHover}
                      whileTap={buttonTap}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className={`${styles.submitBtn} ${isLoading ? styles.loading : ''}`}
                      whileHover={!isLoading ? buttonHover : undefined}
                      whileTap={!isLoading ? buttonTap : undefined}
                    >
                      {isLoading ? (
                        <>
                          <span className={styles.spinner}></span>
                          Creating...
                        </>
                      ) : (
                        <>
                          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Lock It In
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
