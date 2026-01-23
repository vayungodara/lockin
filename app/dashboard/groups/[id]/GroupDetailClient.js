'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import styles from './GroupDetail.module.css';
import TaskCard from '@/components/TaskCard';
import CreateTaskModal from '@/components/CreateTaskModal';
import ActivityFeed from '@/components/ActivityFeed';
import GroupStats from '@/components/GroupStats';

export default function GroupDetailClient({ user, group, userRole }) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeMembers, setActiveMembers] = useState(new Set());
  const [focusLeaderboard, setFocusLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const copyTimeoutRef = useRef(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    try {
      // Fetch group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id, role, joined_at')
        .eq('group_id', group.id);

      if (membersError) throw membersError;

      // Get user IDs to fetch profiles
      const userIds = (membersData || []).map(m => m.user_id);

      // Fetch user profiles separately
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching member profiles:', profilesError);
        }

        if (!profilesError && profilesData) {
          profilesData.forEach(p => {
            profilesMap[p.id] = p;
          });
        }
      }

      // Fetch focus sessions for presence and leaderboard
      if (userIds.length > 0) {
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: focusData, error: focusError } = await supabase
          .from('focus_sessions')
          .select('user_id, duration_minutes, started_at, ended_at')
          .in('user_id', userIds)
          .gte('started_at', sevenDaysAgo);

        if (!focusError && focusData) {
          const active = new Set();
          const userMinutes = {};

          focusData.forEach(session => {
            // Check for active status (started within last 30 mins and not ended)
            if (!session.ended_at && new Date(session.started_at) > new Date(thirtyMinutesAgo)) {
              active.add(session.user_id);
            }

            // Aggregate minutes for leaderboard
            if (session.duration_minutes && session.ended_at) {
              userMinutes[session.user_id] = (userMinutes[session.user_id] || 0) + session.duration_minutes;
            }
          });

          setActiveMembers(active);

          const sortedLeaderboard = Object.entries(userMinutes)
            .map(([id, minutes]) => ({
              id,
              minutes,
              full_name: profilesMap[id]?.full_name || 'Unknown',
              avatar_url: profilesMap[id]?.avatar_url
            }))
            .sort((a, b) => b.minutes - a.minutes)
            .slice(0, 5);

          setFocusLeaderboard(sortedLeaderboard);
        }
      }

      // Transform members data
      const transformedMembers = (membersData || []).map(m => ({
        id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        full_name: profilesMap[m.user_id]?.full_name || 'Unknown',
        avatar_url: profilesMap[m.user_id]?.avatar_url
      }));

      setMembers(transformedMembers);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Get owner IDs from tasks
      const ownerIds = (tasksData || [])
        .filter(t => t.owner_id)
        .map(t => t.owner_id);

      // Fetch owner profiles
      let ownerProfilesMap = {};
      if (ownerIds.length > 0) {
        const { data: ownerProfiles, error: ownerError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .in('id', ownerIds);

        if (ownerError) {
          console.error('Error fetching owner profiles:', ownerError);
        }

        if (!ownerError && ownerProfiles) {
          ownerProfiles.forEach(p => {
            ownerProfilesMap[p.id] = p;
          });
        }
      }

      // Attach owner info to tasks
      const tasksWithOwners = (tasksData || []).map(task => ({
        ...task,
        owner: task.owner_id ? ownerProfilesMap[task.owner_id] || null : null
      }));

      setTasks(tasksWithOwners);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, group?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyInviteLink = async () => {
    try {
      const inviteUrl = `${window.location.origin}/join/${group.invite_code}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedCode(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleTaskCreated = (newTask) => {
    // Add the new task with owner info
    const owner = members.find(m => m.id === newTask.owner_id);
    const taskWithOwner = {
      ...newTask,
      owner: owner ? {
        id: owner.id,
        full_name: owner.full_name,
        avatar_url: owner.avatar_url
      } : null
    };
    setTasks([taskWithOwner, ...tasks]);
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? {
      ...t,
      ...updatedTask,
      owner: updatedTask.owner_id 
        ? members.find(m => m.id === updatedTask.owner_id) 
        : t.owner
    } : t));
  };

  const handleTaskDelete = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // Group tasks by status
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1>{group.name}</h1>
            {group.description && (
              <p className={styles.description}>{group.description}</p>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.inviteBtn} onClick={handleCopyInviteLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {copiedCode ? 'Copied!' : 'Copy Invite Link'}
          </button>
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add Task
          </button>
        </div>
      </header>

      {/* Members Section */}
      <section className={styles.membersSection}>
        <h2 className={styles.sectionTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M23 21V19C23 17.1362 21.7252 15.5701 20 15.126" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 3.12598C17.7252 3.57004 19 5.13616 19 7C19 8.86384 17.7252 10.43 16 10.874" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Members ({members.length})
        </h2>
        <div className={styles.membersList}>
          {members.map((member) => (
            <div key={member.id} className={styles.memberCard}>
              {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={member.full_name || 'Member'}
                    className={styles.memberAvatar}
                    width={36}
                    height={36}
                  />
              ) : (
                <div className={styles.memberAvatarPlaceholder}>
                  {(member.full_name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className={styles.memberName}>
                {member.full_name || 'Unknown'}
                {member.id === user.id && <span className={styles.youBadge}>You</span>}
                {activeMembers.has(member.id) && (
                  <span className={styles.lockedInBadge}>
                    <span className={styles.lockedInDot}></span>
                    Locked In
                  </span>
                )}
                {member.role === 'owner' && <span className={styles.ownerBadge}>Owner</span>}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Kanban Board */}
      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading tasks...</p>
        </div>
      ) : (
        <section className={styles.kanbanSection}>
          <div className={styles.kanbanBoard}>
            {/* To Do Column */}
            <div className={styles.kanbanColumn}>
              <div className={styles.columnHeader}>
                <div className={`${styles.columnDot} ${styles.dotTodo}`}></div>
                <h3>To Do</h3>
                <span className={styles.columnCount}>{todoTasks.length}</span>
              </div>
              <div className={styles.columnContent}>
                {todoTasks.length === 0 ? (
                  <div className={styles.columnEmpty}>
                    <p>No tasks yet</p>
                  </div>
                ) : (
                  todoTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task}
                      currentUser={user}
                      userRole={userRole}
                      members={members}
                      onUpdate={handleTaskUpdate}
                      onDelete={handleTaskDelete}
                    />
                  ))
                )}
              </div>
            </div>

            {/* In Progress Column */}
            <div className={styles.kanbanColumn}>
              <div className={styles.columnHeader}>
                <div className={`${styles.columnDot} ${styles.dotProgress}`}></div>
                <h3>In Progress</h3>
                <span className={styles.columnCount}>{inProgressTasks.length}</span>
              </div>
              <div className={styles.columnContent}>
                {inProgressTasks.length === 0 ? (
                  <div className={styles.columnEmpty}>
                    <p>Nothing in progress</p>
                  </div>
                ) : (
                  inProgressTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task}
                      currentUser={user}
                      userRole={userRole}
                      members={members}
                      onUpdate={handleTaskUpdate}
                      onDelete={handleTaskDelete}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Done Column */}
            <div className={styles.kanbanColumn}>
              <div className={styles.columnHeader}>
                <div className={`${styles.columnDot} ${styles.dotDone}`}></div>
                <h3>Done</h3>
                <span className={styles.columnCount}>{doneTasks.length}</span>
              </div>
              <div className={styles.columnContent}>
                {doneTasks.length === 0 ? (
                  <div className={styles.columnEmpty}>
                    <p>Nothing completed yet</p>
                  </div>
                ) : (
                  doneTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task}
                      currentUser={user}
                      userRole={userRole}
                      members={members}
                      onUpdate={handleTaskUpdate}
                      onDelete={handleTaskDelete}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats & Activity Section - Side by Side */}
      {!isLoading && (
        <section className={styles.activitySection}>
          <div className={styles.activityGrid}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {focusLeaderboard.length > 0 && (
                <div className={styles.leaderboardCard}>
                  <div className={styles.leaderboardHeader}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    Weekly Focus Top 5
                  </div>
                  <div className={styles.leaderboardList}>
                    {focusLeaderboard.map((member, index) => (
                      <div key={member.id} className={styles.leaderboardItem}>
                        <div className={styles.rank}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span className={styles.rankNumber}>{index + 1}</span>}
                        </div>
                        <div className={styles.leaderboardUser}>
                          {member.avatar_url ? (
                            <Image
                              src={member.avatar_url}
                              alt={member.full_name}
                              className={styles.memberAvatar}
                              width={24}
                              height={24}
                              style={{ width: '24px', height: '24px' }}
                            />
                          ) : (
                            <div className={styles.memberAvatarPlaceholder} style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                              {(member.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className={styles.leaderboardName}>{member.full_name}</span>
                        </div>
                        <div className={styles.leaderboardTime}>{member.minutes}m</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <GroupStats groupId={group.id} />
            </div>
            <ActivityFeed groupId={group.id} />
          </div>
        </section>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        groupId={group.id}
        members={members}
      />
    </div>
  );
}
