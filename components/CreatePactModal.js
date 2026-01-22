'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import { modalOverlay, modalContent, buttonHover, buttonTap } from '@/lib/animations';
import styles from './CreatePactModal.module.css';

export default function CreatePactModal({ isOpen, onClose, onPactCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

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


      setTitle('');
      setDescription('');
      setDeadline('');
      setDeadlineTime('23:59');
      setIsRecurring(false);
      setRecurrenceType('daily');
      
      // Notify parent and close
      if (onPactCreated) {
        onPactCreated(data);
      }
      onClose();
    } catch (err) {
      console.error('Error creating pact:', err);
      setError(err.message || 'Failed to create pact. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.overlay} 
          onClick={onClose}
          {...modalOverlay}
        >
          <motion.div 
            className={styles.modal} 
            onClick={(e) => e.stopPropagation()}
            {...modalContent}
          >
            <div className={styles.header}>
              <h2>Create New Pact</h2>
              <motion.button 
                className={styles.closeBtn} 
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                        >
                          Daily
                        </button>
                        <button
                          type="button"
                          className={`${styles.recurrenceBtn} ${recurrenceType === 'weekly' ? styles.active : ''}`}
                          onClick={() => setRecurrenceType('weekly')}
                        >
                          Weekly
                        </button>
                        <button
                          type="button"
                          className={`${styles.recurrenceBtn} ${recurrenceType === 'weekdays' ? styles.active : ''}`}
                          onClick={() => setRecurrenceType('weekdays')}
                        >
                          Weekdays
                        </button>
                      </div>
                      <p className={styles.recurrenceHint}>
                        {recurrenceType === 'daily' && 'This pact will repeat every day'}
                        {recurrenceType === 'weekly' && 'This pact will repeat every week on the same day'}
                        {recurrenceType === 'weekdays' && 'This pact will repeat Monday through Friday'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    className={styles.error}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  onClick={onClose} 
                  className={styles.cancelBtn}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  type="submit" 
                  disabled={isLoading} 
                  className={styles.submitBtn}
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Lock It In
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
