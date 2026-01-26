'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import { useToast } from '@/components/Toast';
import styles from './TaskCard.module.css';

const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export default function TaskCard({ task, currentUser, userRole, members, onUpdate, onDelete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  if (!task || !currentUser) {
    return null;
  }

  const isOwner = task.owner_id === currentUser.id;
  const isCreator = task.created_by === currentUser.id;
  const isGroupOwner = userRole === 'owner';
  const canEdit = isOwner || isCreator || isGroupOwner;
  const canDelete = isCreator || isGroupOwner;

  // Format deadline
  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    const formatted = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    if (task.status === 'done') {
      return { text: formatted, urgency: 'done' };
    }
    
    if (diffDays < 0) {
      return { text: `${formatted} (Overdue)`, urgency: 'overdue' };
    } else if (diffDays === 0) {
      return { text: 'Today', urgency: 'urgent' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', urgency: 'soon' };
    } else if (diffDays <= 3) {
      return { text: formatted, urgency: 'soon' };
    }
    return { text: formatted, urgency: 'normal' };
  };

  const deadline = formatDeadline(task.deadline);

  // Status transitions
  const getStatusActions = () => {
    switch (task.status) {
      case 'todo':
        return [
          { label: 'Start', newStatus: 'in_progress', icon: 'play' },
          { label: 'Done', newStatus: 'done', icon: 'check' }
        ];
      case 'in_progress':
        return [
          { label: 'Back to To Do', newStatus: 'todo', icon: 'back' },
          { label: 'Done', newStatus: 'done', icon: 'check' }
        ];
      case 'done':
        return [
          { label: 'Reopen', newStatus: 'todo', icon: 'back' }
        ];
      default:
        return [];
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!canEdit) return;
    setIsLoading(true);

    try {
      const updates = { 
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', task.id);

      if (error) throw error;

      const actionType = newStatus === 'done' ? 'task_completed' : newStatus === 'in_progress' ? 'task_started' : 'task_reopened';
      await logActivity(supabase, actionType, task.group_id, { task_title: task.title });

      onUpdate({ ...task, ...updates });
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimTask = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ owner_id: currentUser.id })
        .eq('id', task.id);

      if (error) throw error;

      await logActivity(supabase, 'task_claimed', task.group_id, { task_title: task.title });

      onUpdate({ ...task, owner_id: currentUser.id });
    } catch (err) {
      console.error('Error claiming task:', err);
      toast.error('Failed to claim task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;

      await logActivity(supabase, 'task_deleted', task.group_id, { task_title: task.title });

      onDelete(task.id);
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const statusActions = getStatusActions();

  const handleCardInteraction = () => {
    if (isTouch && canEdit) {
      setShowActions(prev => !prev);
    }
  };

  return (
    <div 
      className={`${styles.card} ${isLoading ? styles.loading : ''} ${isTouch && showActions ? styles.actionsVisible : ''}`}
      onMouseEnter={() => !isTouch && setShowActions(true)}
      onMouseLeave={() => !isTouch && setShowActions(false)}
      onClick={handleCardInteraction}
      onKeyDown={(e) => e.key === 'Enter' && handleCardInteraction()}
      role="button"
      tabIndex={0}
    >
      {/* Task Title & Description */}
      <div className={styles.content}>
        <h4 className={styles.title}>{task.title}</h4>
        {task.description && (
          <p className={styles.description}>{task.description}</p>
        )}
      </div>

      {/* Task Meta */}
      <div className={styles.meta}>
        {/* Owner */}
        <div className={styles.owner}>
          {task.owner ? (
            <>
              {task.owner.avatar_url ? (
                <Image
                  src={task.owner.avatar_url}
                  alt={task.owner.full_name || 'Owner'}
                  className={styles.ownerAvatar}
                  width={22}
                  height={22}
                />
              ) : (
                <div className={styles.ownerAvatarPlaceholder}>
                  {task.owner.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <span className={styles.ownerName}>
                {task.owner.id === currentUser.id ? 'You' : task.owner.full_name?.split(' ')[0]}
              </span>
            </>
          ) : (
            <button 
              className={styles.claimBtn}
              onClick={handleClaimTask}
              disabled={isLoading}
              aria-label="Claim this task"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Claim
            </button>
          )}
        </div>

        {/* Deadline */}
        {deadline && (
          <div className={`${styles.deadline} ${styles[deadline.urgency]}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {deadline.text}
          </div>
        )}
      </div>

      {/* Quick Actions (shown on hover) */}
      {(showActions || isLoading) && canEdit && (
        <div className={styles.actions}>
          {statusActions.map((action) => (
            <button
              key={action.newStatus}
              className={`${styles.actionBtn} ${action.icon === 'check' ? styles.actionSuccess : ''}`}
              onClick={() => handleStatusChange(action.newStatus)}
              disabled={isLoading}
              aria-label={action.label}
            >
              {action.icon === 'play' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 3L19 12L5 21V3Z" fill="currentColor"/>
                </svg>
              )}
              {action.icon === 'check' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {action.icon === 'back' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
          
          {canDelete && (
            <button
              className={`${styles.actionBtn} ${styles.actionDanger}`}
              onClick={handleDelete}
              disabled={isLoading}
              aria-label="Delete task"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}
    </div>
  );
}
