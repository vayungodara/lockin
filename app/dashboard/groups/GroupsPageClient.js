'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import styles from './GroupsPage.module.css';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CreateGroupModal from '@/components/CreateGroupModal';
import JoinGroupModal from '@/components/JoinGroupModal';
import { fadeInUp } from '@/lib/animations';

// Deterministic color based on group name — consistent across renders
const GROUP_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366F1' },   // indigo
  { bg: 'rgba(139, 92, 246, 0.12)', text: '#8B5CF6' },   // purple
  { bg: 'rgba(236, 72, 153, 0.12)', text: '#EC4899' },    // pink
  { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981' },    // emerald
  { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B' },    // amber
  { bg: 'rgba(59, 130, 246, 0.12)', text: '#3B82F6' },    // blue
  { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444' },     // red
  { bg: 'rgba(20, 184, 166, 0.12)', text: '#14B8A6' },    // teal
];

function getGroupColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

export default function GroupsPageClient({ user }) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchGroups = useCallback(async () => {
    try {
      // Get group memberships for this user
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id, role, joined_at')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Member query error:', memberError);
        throw memberError;
      }

      if (!memberData || memberData.length === 0) {
        setGroups([]);
        setIsLoading(false);
        return;
      }

      // Get the group IDs
      const groupIds = memberData.map(m => m.group_id);

      // Fetch the actual groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Groups query error:', groupsError);
        throw groupsError;
      }

      // Fetch members (with user_id for profile lookup) and tasks (with status) in parallel
      const [membersResult, tasksResult] = await Promise.all([
        supabase.from('group_members').select('group_id, user_id').in('group_id', groupIds),
        supabase.from('tasks').select('group_id, status').in('group_id', groupIds),
      ]);

      if (membersResult.error) throw membersResult.error;
      if (tasksResult.error) throw tasksResult.error;

      // Collect all unique user IDs across groups for profile fetch
      const allUserIds = [...new Set((membersResult.data || []).map(m => m.user_id))];

      // Fetch profiles for avatar stacking
      let profilesMap = {};
      if (allUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', allUserIds);

        if (!profilesError && profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }

      // Build per-group member lists with profile data
      const membersByGroup = (membersResult.data || []).reduce((acc, row) => {
        if (!acc[row.group_id]) acc[row.group_id] = [];
        acc[row.group_id].push({
          user_id: row.user_id,
          full_name: profilesMap[row.user_id]?.full_name || null,
          avatar_url: profilesMap[row.user_id]?.avatar_url || null,
        });
        return acc;
      }, {});

      // Build per-group task stats
      const taskStatsByGroup = (tasksResult.data || []).reduce((acc, row) => {
        if (!acc[row.group_id]) acc[row.group_id] = { total: 0, done: 0 };
        acc[row.group_id].total += 1;
        if (row.status === 'done') acc[row.group_id].done += 1;
        return acc;
      }, {});

      const groupsWithCounts = (groupsData || []).map((group) => {
        const membership = memberData.find(m => m.group_id === group.id);
        const groupMembers = membersByGroup[group.id] || [];
        const taskStats = taskStatsByGroup[group.id] || { total: 0, done: 0 };

        return {
          ...group,
          role: membership?.role || 'member',
          memberCount: groupMembers.length,
          members: groupMembers,
          taskCount: taskStats.total,
          tasksDone: taskStats.done,
        };
      });

      setGroups(groupsWithCounts);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [...prev, {
      ...newGroup,
      role: 'owner',
      memberCount: 1,
      members: [{ user_id: user.id, full_name: null, avatar_url: null }],
      taskCount: 0,
      tasksDone: 0,
    }]);
  };

  const handleGroupJoined = (joinedGroup) => {
    fetchGroups(); // Refresh to get accurate counts
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Groups</h1>
          <p className={styles.subtitle}>{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-secondary" onClick={() => setIsJoinModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Join Group
          </button>
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create Group
          </button>
        </div>
      </div>

      {/* Groups List */}
      {error ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchGroups}>Try Again</button>
        </div>
      ) : isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading your groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <motion.div className={styles.emptyState} {...fadeInUp}>
          <motion.div
            className={styles.emptyIllustration}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="55" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
              <circle cx="60" cy="45" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
              <circle cx="80" cy="55" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
              <circle cx="40" cy="50" r="4" fill="currentColor" opacity="0.2" />
              <path d="M32 62a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
              <circle cx="60" cy="40" r="4" fill="currentColor" opacity="0.35" />
              <path d="M52 52a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
              <circle cx="80" cy="50" r="4" fill="currentColor" opacity="0.2" />
              <path d="M72 62a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
              <path d="M48 48L52 46" stroke="currentColor" strokeWidth="1" opacity="0.15" />
              <path d="M68 46L72 48" stroke="currentColor" strokeWidth="1" opacity="0.15" />
            </svg>
          </motion.div>
          <h3 className={styles.emptyTitle}>Better together. Way better.</h3>
          <p className={styles.emptySubtext}>Create a group to tackle projects with friends and hold each other accountable.</p>
          <button className={styles.emptyAction} onClick={() => setIsCreateModalOpen(true)}>
            + Create Your First Group
          </button>
        </motion.div>
      ) : (
        <div className={styles.groupsGrid}>
          {groups.map((group) => {
            const color = getGroupColor(group.name);
            const displayMembers = (group.members || []).slice(0, 4);
            const extraMembers = Math.max(0, (group.members || []).length - 4);
            const progressPct = group.taskCount > 0
              ? Math.round((group.tasksDone / group.taskCount) * 100)
              : 0;

            return (
              <Link href={`/dashboard/groups/${group.id}`} key={group.id} className={styles.groupCard}>
                <div className={styles.groupHeader}>
                  <div
                    className={styles.groupIcon}
                    style={{ background: color.bg, color: color.text }}
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.groupInfo}>
                    <div className={styles.groupTitleRow}>
                      <h3>{group.name}</h3>
                      {group.role === 'owner' && (
                        <span className={styles.ownerBadge}>Owner</span>
                      )}
                    </div>
                    <p className={styles.groupMeta}>
                      {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                      <span className={styles.metaDot}></span>
                      {group.taskCount} task{group.taskCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {group.description && (
                  <p className={styles.groupDescription}>{group.description}</p>
                )}

                {/* Task progress bar */}
                {group.taskCount > 0 && (
                  <div className={styles.progressSection}>
                    <div className={styles.progressLabel}>
                      <span>{group.tasksDone} of {group.taskCount} done</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Member avatar stack + stats footer */}
                <div className={styles.cardFooter}>
                  <div className={styles.avatarStack}>
                    {displayMembers.map((member, i) => (
                      <div
                        key={member.user_id}
                        className={styles.avatar}
                        style={{ zIndex: displayMembers.length - i }}
                        title={member.full_name || 'Member'}
                      >
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt={member.full_name || 'Member'}
                            width={28}
                            height={28}
                            className={styles.avatarImg}
                          />
                        ) : (
                          <span className={styles.avatarFallback}>
                            {(member.full_name || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                    {extraMembers > 0 && (
                      <div className={styles.avatarExtra}>
                        +{extraMembers}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
      <JoinGroupModal 
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onGroupJoined={handleGroupJoined}
      />
    </div>
  );
}
