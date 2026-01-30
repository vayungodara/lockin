'use client';

import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import { fireConfettiFromElement } from '@/lib/confetti';
import { cardHover, buttonHover, buttonTap } from '@/lib/animations';
import { useToast } from '@/components/Toast';
import styles from './PactCard.module.css';

export default function PactCard({ pact, onUpdate, onNewRecurringPact }) {
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef(null);
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  if (!pact) {
    return null;
  }

  const isOverdue = new Date(pact.deadline) < new Date() && pact.status === 'active';
  const deadlineDate = new Date(pact.deadline);

  // Calculate next deadline for recurring pacts
  const getNextDeadline = (currentDeadline, recurrenceType) => {
    const next = new Date(currentDeadline);

    switch (recurrenceType) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'weekdays':
        // Move to next weekday
        do {
          next.setDate(next.getDate() + 1);
        } while (next.getDay() === 0 || next.getDay() === 6); // Skip weekends
        break;
      default:
        next.setDate(next.getDate() + 1);
    }

    return next;
  };
  
  // Format deadline
  const formatDeadline = () => {
    const now = new Date();
    const diff = deadlineDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (pact.status === 'completed') {
      return 'Completed';
    }
    
    if (pact.status === 'missed') {
      return 'Missed';
    }
    
    if (diff < 0) {
      return 'Overdue';
    }
    
    if (days === 0) {
      if (hours === 0) {
        return 'Due in less than an hour';
      }
      return `Due in ${hours} hour${hours === 1 ? '' : 's'}`;
    }
    
    if (days === 1) {
      return 'Due tomorrow';
    }
    
    if (days < 7) {
      return `Due in ${days} days`;
    }
    
    return `Due ${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Mark current pact as completed
      const { error } = await supabase
        .from('pacts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', pact.id);

      if (error) throw error;

      await logActivity(supabase, 'pact_completed', null, { pact_description: pact.title });

      fireConfettiFromElement(cardRef.current);

      // If recurring, create the next pact
      if (pact.is_recurring && pact.recurrence_type) {
        const nextDeadline = getNextDeadline(pact.deadline, pact.recurrence_type);

        const { data: newPact, error: createError } = await supabase
          .from('pacts')
          .insert({
            user_id: pact.user_id,
            title: pact.title,
            description: pact.description,
            deadline: nextDeadline.toISOString(),
            status: 'active',
            is_recurring: true,
            recurrence_type: pact.recurrence_type
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating recurring pact:', createError);
          toast.error('Pact completed, but failed to create next recurring pact.');
        } else {
          toast.success(`Next ${pact.recurrence_type} pact created!`);
          if (onNewRecurringPact) {
            onNewRecurringPact(newPact);
          }
        }
      }

      if (onUpdate) {
        onUpdate({ ...pact, status: 'completed', completed_at: new Date().toISOString() });
      }
    } catch (err) {
      console.error('Error completing pact:', err);
      toast.error('Failed to complete pact. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMiss = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('pacts')
        .update({ status: 'missed' })
        .eq('id', pact.id);

      if (error) throw error;

      await logActivity(supabase, 'pact_missed', null, { pact_description: pact.title });
      
      if (onUpdate) {
        onUpdate({ ...pact, status: 'missed' });
      }
    } catch (err) {
      console.error('Error marking pact as missed:', err);
      toast.error('Failed to update pact. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusClass = () => {
    if (pact.status === 'completed') return styles.completed;
    if (pact.status === 'missed' || isOverdue) return styles.missed;
    return styles.active;
  };

  return (
    <motion.div 
      ref={cardRef}
      className={`${styles.card} ${getStatusClass()}`}
      whileHover={pact.status === 'active' ? cardHover : undefined}
      layout
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{pact.title}</h3>
          <span className={`${styles.badge} ${getStatusClass()}`}>
            {pact.status === 'completed' ? 'Done' : pact.status === 'missed' ? 'Missed' : isOverdue ? 'Overdue' : 'Active'}
          </span>
        </div>
        
        {pact.description && (
          <p className={styles.description}>{pact.description}</p>
        )}
        
        <div className={styles.footer}>
          <div className={styles.deadline}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {formatDeadline()}
          </div>
          
          {pact.status === 'active' && (
            <div className={styles.actions}>
              <motion.button 
                onClick={handleMiss} 
                disabled={isLoading}
                className={styles.missBtn}
                aria-label="Mark pact as missed"
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
              <motion.button 
                onClick={handleComplete} 
                disabled={isLoading}
                className={styles.completeBtn}
                aria-label="Mark pact as complete"
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
