'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useModalScrollLock } from '@/lib/useModalScrollLock';
import { modalContent, buttonHover, buttonTap } from '@/lib/animations';
import styles from './CreateGroupModal.module.css';

// Generate a cryptographically secure invite code
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
};

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = useMemo(() => createClient(), []);

  useModalScrollLock(isOpen);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name.trim()) {
      setError('Please enter a group name');
      setIsLoading(false);
      return;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      
      if (!user) {
        setError('You must be signed in to create a group');
        setIsLoading(false);
        return;
      }

      const inviteCode = generateInviteCode();

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          invite_code: inviteCode,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as owner member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // Reset form
      setName('');
      setDescription('');
      
      // Notify parent and close
      if (onGroupCreated) {
        onGroupCreated(group);
      }
      onClose();
    } catch (err) {
      console.error('Error creating group:', err);
      if (err.code === '23505') {
        setError('A group with this invite code already exists. Please try again.');
      } else {
        setError(err.message || 'Failed to create group. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && createPortal(
        <div className={styles.overlay} onClick={onClose}>
          <motion.div className={styles.modal} onClick={(e) => e.stopPropagation()} {...modalContent}>
            <div className={styles.header}>
              <div className={styles.headerText}>
                <h2>Start a Group</h2>
                <p className={styles.subtitle}>Accountability is better together</p>
              </div>
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
                <label htmlFor="name" className={styles.label}>
                  Group Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., CS101 Final Project"
                  className={styles.input}
                  autoFocus
                />
                <span className={styles.hint}>Choose a name your crew will recognize</span>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="description" className={styles.label}>
                  Description <span className={styles.optional}>(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this group working toward?"
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <div className={styles.inviteSection}>
                <div className={styles.inviteIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 8V14M17 11H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.inviteText}>
                  <span className={styles.inviteTitle}>Invite link created automatically</span>
                  <span className={styles.inviteDesc}>Share the code after creating to bring your crew in</span>
                </div>
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 8V14M17 11H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Start Group
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}
