'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './GroupDetail.module.css';
import TaskCard from '@/components/TaskCard';
import CreateTaskModal from '@/components/CreateTaskModal';
import ActivityFeed from '@/components/ActivityFeed';
import GroupStats from '@/components/GroupStats';
import NudgeButton from '@/components/NudgeButton';
import SectionHeader from '@/components/SectionHeader';
import UserAvatar from '@/components/UserAvatar';

const COLUMN_CAPTIONS = {
  todo: 'Untouched',
  doing: 'In motion',
  done: 'Delivered',
};

const COLUMN_EMPTY = {
  todo: 'Drop a task here.',
  doing: 'Nobody&rsquo;s moving.',
  done: 'Nothing delivered yet.',
};

export default function GroupDetailClient({ user, group, userRole }) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeMembers, setActiveMembers] = useState(new Set());
  const [focusLeaderboard, setFocusLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const copyTimeoutRef = useRef(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    try {
      // Fetch group members and tasks in parallel
      const [membersResult, tasksResult] = await Promise.all([
        supabase
          .from('group_members')
          .select('user_id, role, joined_at')
          .eq('group_id', group.id),
        supabase
          .from('tasks')
          .select('*')
          .eq('group_id', group.id)
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      if (membersResult.error) throw membersResult.error;
      if (tasksResult.error) throw tasksResult.error;

      const membersData = membersResult.data || [];
      const tasksData = tasksResult.data || [];

      // Fetch profiles for all members in a single batch query
      // (group_members.user_id references auth.users, not profiles directly,
      //  so PostgREST cannot auto-join — we do it manually)
      const profilesMap = {};
      const memberUserIds = membersData.map((m) => m.user_id);
      if (memberUserIds.length > 0) {
        const { data: memberProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', memberUserIds);

        if (!profilesError && memberProfiles) {
          memberProfiles.forEach((p) => {
            profilesMap[p.id] = p;
          });
        }
      }

      // Fetch focus sessions for presence and leaderboard
      if (memberUserIds.length > 0) {
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: focusData, error: focusError } = await supabase
          .from('focus_sessions')
          .select('user_id, duration_minutes, started_at, ended_at')
          .in('user_id', memberUserIds)
          .gte('started_at', sevenDaysAgo)
          .limit(100);

        if (!focusError && focusData) {
          const active = new Set();
          const userMinutes = {};

          focusData.forEach((session) => {
            // Active = started in last 30 mins and not ended
            if (
              !session.ended_at &&
              new Date(session.started_at) > new Date(thirtyMinutesAgo)
            ) {
              active.add(session.user_id);
            }

            // Aggregate minutes for leaderboard
            if (session.duration_minutes && session.ended_at) {
              userMinutes[session.user_id] =
                (userMinutes[session.user_id] || 0) + session.duration_minutes;
            }
          });

          setActiveMembers(active);

          const sortedLeaderboard = Object.entries(userMinutes)
            .map(([id, minutes]) => ({
              id,
              minutes,
              full_name: profilesMap[id]?.full_name || 'Unknown',
              avatar_url: profilesMap[id]?.avatar_url,
            }))
            .sort((a, b) => b.minutes - a.minutes)
            .slice(0, 5);

          setFocusLeaderboard(sortedLeaderboard);
        }
      }

      // Transform members data using joined profiles
      const transformedMembers = membersData.map((m) => ({
        id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        full_name: profilesMap[m.user_id]?.full_name || 'Unknown',
        avatar_url: profilesMap[m.user_id]?.avatar_url,
      }));

      setMembers(transformedMembers);

      // Get unique owner IDs not already in profilesMap
      const ownerIds = [
        ...new Set(
          tasksData
            .filter((t) => t.owner_id && !profilesMap[t.owner_id])
            .map((t) => t.owner_id)
        ),
      ];

      // Only fetch owner profiles that we don't already have from the members join
      if (ownerIds.length > 0) {
        const { data: ownerProfiles, error: ownerError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', ownerIds);

        if (ownerError) {
          console.error('Error fetching owner profiles:', ownerError);
        }

        if (!ownerError && ownerProfiles) {
          ownerProfiles.forEach((p) => {
            profilesMap[p.id] = p;
          });
        }
      }

      // Attach owner info to tasks (using the shared profilesMap)
      const tasksWithOwners = tasksData.map((task) => ({
        ...task,
        owner: task.owner_id ? profilesMap[task.owner_id] || null : null,
      }));

      setTasks(tasksWithOwners);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load group data. Please try again.');
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
    const owner = members.find((m) => m.id === newTask.owner_id);
    const taskWithOwner = {
      ...newTask,
      owner: owner
        ? {
            id: owner.id,
            full_name: owner.full_name,
            avatar_url: owner.avatar_url,
          }
        : null,
    };
    setTasks((prev) => [taskWithOwner, ...prev]);
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === updatedTask.id
          ? {
              ...t,
              ...updatedTask,
              owner: updatedTask.owner_id
                ? members.find((m) => m.id === updatedTask.owner_id)
                : t.owner,
            }
          : t
      )
    );
  };

  const handleTaskDelete = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Group tasks by status (memoized to avoid recomputing on unrelated re-renders)
  const todoTasks = useMemo(
    () => tasks.filter((t) => t.status === 'todo'),
    [tasks]
  );
  const inProgressTasks = useMemo(
    () => tasks.filter((t) => t.status === 'in_progress'),
    [tasks]
  );
  const doneTasks = useMemo(
    () => tasks.filter((t) => t.status === 'done'),
    [tasks]
  );

  const displayMembers = members.slice(0, 8);
  const extraMembers = Math.max(0, members.length - 8);
  const groupTagline =
    group.course || (group.description ? null : 'Study circle');

  return (
    <div className={styles.container}>
      {/* Back link */}
      <Link href="/dashboard/groups" className={styles.backLink}>
        ← All groups
      </Link>

      {/* Editorial header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerCaption}>
            {groupTagline ? `${groupTagline} · ` : ''}
            BOARD {String(group.id).slice(0, 8).toUpperCase()}
          </div>
          <h1>{group.name}</h1>
          {group.description && (
            <p className={styles.description}>{group.description}</p>
          )}

          <div className={styles.headerMeta}>
            <div className={styles.headerRoster}>
              {displayMembers.map((m) => (
                <UserAvatar
                  key={m.id}
                  user={{
                    id: m.id,
                    full_name: m.full_name,
                    avatar_url: m.avatar_url,
                  }}
                  size="md"
                  className={styles.headerRosterTile}
                />
              ))}
              {extraMembers > 0 && (
                <span className={styles.headerRosterExtra}>+{extraMembers}</span>
              )}
            </div>
            <span className={styles.divider} aria-hidden="true" />
            <div className={styles.headerStat}>
              <span className={styles.headerStatLabel}>Members</span>
              <span className={styles.headerStatValue}>{members.length}</span>
            </div>
            <div className={styles.headerStat}>
              <span className={styles.headerStatLabel}>Tasks</span>
              <span className={styles.headerStatValue}>{tasks.length}</span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.inviteBtn}
            onClick={handleCopyInviteLink}
          >
            {copiedCode ? 'Copied!' : 'Copy invite link'}
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Add task
          </button>
        </div>
      </header>

      {/* Members detail row — chips + nudge buttons (keeps `Locked In`,
          `You`, `Owner` tags + nudge action accessible). */}
      {!isLoading && members.length > 0 && (
        <section className={styles.membersSection}>
          <div className={styles.membersList}>
            {members.map((member) => {
              const isActive = activeMembers.has(member.id);
              return (
                <div
                  key={member.id}
                  className={`${styles.memberCard} ${isActive ? styles.memberCardActive : ''}`}
                >
                  <UserAvatar
                    user={{
                      id: member.id,
                      full_name: member.full_name,
                      avatar_url: member.avatar_url,
                    }}
                    size="sm"
                  />
                  <span className={styles.memberName}>
                    {member.full_name || 'Unknown'}
                    {member.id === user.id && (
                      <span className={styles.youBadge}>You</span>
                    )}
                    {isActive && (
                      <span className={styles.lockedInChip}>
                        <span
                          className={styles.lockedInDot}
                          aria-hidden="true"
                        />
                        Locked In
                      </span>
                    )}
                    {member.role === 'owner' && (
                      <span className={styles.ownerBadge}>Owner</span>
                    )}
                  </span>
                  {member.id !== user.id && (
                    <NudgeButton
                      userId={member.id}
                      userName={member.full_name || 'them'}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* § 01 — Today's tasks */}
      {error ? (
        <div className={styles.loadingState}>
          <p>{error}</p>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={fetchData}
            style={{ marginTop: '1rem' }}
          >
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading tasks...</p>
        </div>
      ) : (
        <section className={styles.kanbanSection}>
          <SectionHeader number={1} title="Today's tasks" caption="Board" />
          <div className={styles.kanbanBoard}>
            {/* To Do */}
            <div className={styles.kanbanColumn}>
              <div className={styles.columnHeader}>
                <span className={`${styles.columnDot} ${styles.dotTodo}`} />
                <h3>To do</h3>
                <span className={styles.columnCount}>{todoTasks.length}</span>
                <span className={styles.columnCaption}>
                  {COLUMN_CAPTIONS.todo}
                </span>
              </div>
              <div className={styles.columnContent}>
                {todoTasks.length === 0 ? (
                  <div className={styles.columnEmpty}>
                    <p>{COLUMN_EMPTY.todo}</p>
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

            {/* Doing */}
            <div className={styles.kanbanColumn}>
              <div className={styles.columnHeader}>
                <span className={`${styles.columnDot} ${styles.dotProgress}`} />
                <h3>Doing</h3>
                <span className={styles.columnCount}>
                  {inProgressTasks.length}
                </span>
                <span className={styles.columnCaption}>
                  {COLUMN_CAPTIONS.doing}
                </span>
              </div>
              <div className={styles.columnContent}>
                {inProgressTasks.length === 0 ? (
                  <div className={styles.columnEmpty}>
                    <p>Nobody&rsquo;s moving.</p>
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

            {/* Done */}
            <div className={styles.kanbanColumn}>
              <div className={styles.columnHeader}>
                <span className={`${styles.columnDot} ${styles.dotDone}`} />
                <h3>Done</h3>
                <span className={styles.columnCount}>{doneTasks.length}</span>
                <span className={styles.columnCaption}>
                  {COLUMN_CAPTIONS.done}
                </span>
              </div>
              <div className={styles.columnContent}>
                {doneTasks.length === 0 ? (
                  <div className={styles.columnEmpty}>
                    <p>Nothing delivered yet.</p>
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

      {/* § 02 — Group stats / activity */}
      {!isLoading && (
        <section className={styles.activitySection}>
          <SectionHeader
            number={2}
            title="Group activity"
            caption="This week"
          />
          <div className={styles.activityGrid}>
            <div className={styles.activitySidebar}>
              {focusLeaderboard.length > 0 && (
                <div className={styles.leaderboardCard}>
                  <div className={styles.leaderboardHeader}>
                    Weekly focus · top 5
                  </div>
                  <div className={styles.leaderboardList}>
                    {focusLeaderboard.map((member, index) => (
                      <div
                        key={member.id}
                        className={styles.leaderboardItem}
                      >
                        <div className={styles.rank}>
                          <span className={styles.rankNumber}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <div className={styles.leaderboardUser}>
                          <UserAvatar
                            user={{
                              id: member.id,
                              full_name: member.full_name,
                              avatar_url: member.avatar_url,
                            }}
                            size="xs"
                          />
                          <span className={styles.leaderboardName}>
                            {member.full_name}
                          </span>
                        </div>
                        <div className={styles.leaderboardTime}>
                          {member.minutes}m
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <GroupStats groupId={group.id} />
            </div>
            <div className={styles.activityPanel}>
              <ActivityFeed groupId={group.id} pageSize={10} />
            </div>
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
