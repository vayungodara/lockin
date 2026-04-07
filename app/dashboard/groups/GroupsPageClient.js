'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import styles from './GroupsPage.module.css';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CreateGroupModal from '@/components/CreateGroupModal';
import JoinGroupModal from '@/components/JoinGroupModal';
import EmptyState from '@/components/EmptyState';
import { fadeInUp } from '@/lib/animations';
// Warm muted palette for group letter-initial avatars
const WARM_GROUP_COLORS = [
  { bg: 'rgba(196, 131, 106, 0.14)', text: '#C4836A' }, // Terracotta
  { bg: 'rgba(122, 154, 126, 0.14)', text: '#7A9A7E' }, // Sage
  { bg: 'rgba(201, 165, 77, 0.14)',  text: '#C9A54D' }, // Amber
  { bg: 'rgba(139, 134, 128, 0.14)', text: '#8B8680' }, // Warm gray
  { bg: 'rgba(107, 143, 173, 0.14)', text: '#6B8FAD' }, // Dusty blue
];

function getGroupColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return WARM_GROUP_COLORS[Math.abs(hash) % WARM_GROUP_COLORS.length];
}

function GroupCard({ group, isHero = false }) {
  const color = getGroupColor(group.name);
  const displayMembers = (group.members || []).slice(0, 4);
  const extraMembers = Math.max(0, (group.members || []).length - 4);
  const progressPct = group.taskCount > 0
    ? Math.round((group.tasksDone / group.taskCount) * 100)
    : 0;

  return (
    <Link href={`/dashboard/groups/${group.id}`} className={`${styles.groupCard} ${isHero ? styles.groupCardHero : ''}`}>
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
}

function GroupSections({ groups }) {
  const ownedGroups = groups.filter(g => g.role === 'owner');
  const joinedGroups = groups.filter(g => g.role !== 'owner');

  // Identify the most active group (highest task count) for hero treatment.
  // Only apply hero when there are 3+ groups to avoid odd layout with 1-2 cards.
  const mostActiveId = groups.length >= 3
    ? groups.reduce((best, g) => (g.taskCount > (best?.taskCount || 0) ? g : best), null)?.id
    : null;

  return (
    <div>
      {ownedGroups.length > 0 && (
        <>
          <h3 className={styles.sectionHeader}>Your Groups</h3>
          <div className={styles.groupsGrid}>
            {ownedGroups.map(group => (
              <GroupCard key={group.id} group={group} isHero={group.id === mostActiveId} />
            ))}
          </div>
        </>
      )}
      {joinedGroups.length > 0 && (
        <>
          <h3 className={styles.sectionHeader}>Joined Groups</h3>
          <div className={styles.groupsGrid}>
            {joinedGroups.map(group => (
              <GroupCard key={group.id} group={group} isHero={group.id === mostActiveId} />
            ))}
          </div>
        </>
      )}
    </div>
  );
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
        .in('id', groupIds)
        .limit(250);

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
        <EmptyState
          floating={false}
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--danger)' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
          title="Something went wrong"
          description={error}
          action={{ label: 'Try Again', onClick: fetchGroups }}
        />
      ) : isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading your groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="42" cy="38" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.5" fill="rgba(var(--accent-primary-rgb), 0.08)" />
              <path d="M42 46V68" stroke="currentColor" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
              <path d="M42 68L34 82" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              <path d="M42 68L50 82" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              <path d="M42 52L28 42" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              <path d="M42 52L60 28" stroke="currentColor" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
              <circle cx="78" cy="38" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.5" fill="rgba(var(--accent-primary-rgb), 0.08)" />
              <path d="M78 46V68" stroke="currentColor" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
              <path d="M78 68L70 82" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              <path d="M78 68L86 82" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              <path d="M78 52L92 42" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              <path d="M78 52L60 28" stroke="currentColor" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
              <circle cx="60" cy="28" r="3" fill="currentColor" opacity="0.3" />
              <path d="M60 18V22" stroke="currentColor" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
              <path d="M52 22L55 25" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
              <path d="M68 22L65 25" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
            </svg>
          }
          title="Better together. Way better."
          description="Create a group to tackle projects with friends and hold each other accountable."
          action={{ label: '+ Create Your First Group', onClick: () => setIsCreateModalOpen(true) }}
          secondaryAction={
            <button className={styles.emptyActionSecondary} onClick={() => setIsJoinModalOpen(true)}>
              Join a Group
            </button>
          }
        />
      ) : (
        <GroupSections groups={groups} />
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
