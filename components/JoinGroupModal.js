'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { modalOverlay, modalContent, buttonHover, buttonTap } from '@/lib/animations';
import styles from './CreateGroupModal.module.css';

export default function JoinGroupModal({ isOpen, onClose, onGroupJoined }) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const code = inviteCode.trim().toUpperCase();

    if (!code) {
      setError('Please enter an invite code');
      setIsLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      
      if (!user) {
        setError('You must be signed in to join a group');
        setIsLoading(false);
        return;
      }

      // Find the group by invite code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', code)
        .single();

      if (groupError || !group) {
        setError('Invalid invite code. Please check and try again.');
        setIsLoading(false);
        return;
      }

      // Check if already a member
      const { data: existingMember, error: existingError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingMember) {
        setError('You are already a member of this group.');
        setIsLoading(false);
        return;
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) throw joinError;

      // Reset form
      setInviteCode('');
      
      // Notify parent and close
      if (onGroupJoined) {
        onGroupJoined(group);
      }
      onClose();
    } catch (err) {
      console.error('Error joining group:', err);
      setError(err.message || 'Failed to join group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className={styles.overlay} onClick={onClose} {...modalOverlay}>
          <motion.div className={styles.modal} onClick={(e) => e.stopPropagation()} {...modalContent}>
            <div className={styles.header}>
              <h2>Join a Group</h2>
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
                <label htmlFor="inviteCode" className={styles.label}>
                  Invite Code
                </label>
                <input
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  className={styles.input}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className={styles.infoBox}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>Ask your group leader for the 6-character invite code.</p>
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
                      Joining...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Join Group
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
