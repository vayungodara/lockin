'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './GroupsPage.module.css';
import Link from 'next/link';
import CreateGroupModal from '@/components/CreateGroupModal';
import JoinGroupModal from '@/components/JoinGroupModal';
import EmptyState from '@/components/EmptyState';
import UserAvatar from '@/components/UserAvatar';

function GroupCard({ group, isHero = false }) {
  const displayMembers = (group.members || []).slice(0, 4);
  const extraMembers = Math.max(0, (group.members || []).length - 4);
  const todoCount = group.tasksTodo ?? 0;
  const doingCount = group.tasksDoing ?? 0;
  const doneCount = group.tasksDone ?? 0;
  const progressPct = group.taskCount > 0
    ? Math.round(((group.tasksDone || 0) / group.taskCount) * 100)
    : 0;

  return (
    <Link
      href={`/dashboard/groups/${group.id}`}
      className={`${styles.groupCard} ${isHero ? styles.groupCardHero : ''}`}
    >
      {isHero && (
        <span className={styles.heroBadge} aria-label="Most active group">
          Most Active
        </span>
      )}

      <div className={styles.cardHead}>
        <div className={styles.cardHeadInner}>
          <div className={styles.cardCaption}>
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            {group.role === 'owner' && (
              <span className={styles.ownerTag}>Owner</span>
            )}
          </div>
          <h3 className={styles.cardTitle}>{group.name}</h3>
        </div>

        <div className={styles.roster}>
          {displayMembers.map((member) => (
            <UserAvatar
              key={member.user_id}
              user={{
                id: member.user_id,
                full_name: member.full_name,
                avatar_url: member.avatar_url,
              }}
              size="sm"
              className={styles.rosterTile}
            />
          ))}
          {extraMembers > 0 && (
            <span className={styles.rosterExtra}>+{extraMembers}</span>
          )}
        </div>
      </div>

      {group.description && (
        <p className={styles.cardDescription}>{group.description}</p>
      )}

      <div className={styles.ruleDotted} />

      <div className={styles.statsRow}>
        <div className={styles.statBlock}>
          <div className={styles.statLabel}>To Do</div>
          <div className={styles.statValue}>{todoCount}</div>
        </div>
        <div className={`${styles.statBlock} ${styles.statBlockDoing}`}>
          <div className={styles.statLabel}>Doing</div>
          <div className={styles.statValue}>{doingCount}</div>
        </div>
        <div className={`${styles.statBlock} ${styles.statBlockDone}`}>
          <div className={styles.statLabel}>Done</div>
          <div className={styles.statValue}>{doneCount}</div>
        </div>
        <div className={styles.statPct}>{progressPct}%</div>
      </div>

      {group.taskCount > 0 && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <div className={styles.cardFooter}>
        <span className={styles.cardFooterLabel}>Enter board</span>
        <span className={styles.cardFooterArrow}>→</span>
      </div>
    </Link>
  );
}

function CreateCard({ onClick }) {
  return (
    <button type="button" className={styles.createCard} onClick={onClick}>
      <div>
        <div className={styles.cardCaption}>§ CREATE</div>
        <h3 className={styles.cardTitle}>Start a new group.</h3>
        <p
          className={styles.cardDescription}
          style={{ marginTop: 8 }}
        >
          Pull your friends in. 2–8 members is the sweet spot.
        </p>
      </div>
      <div className={styles.createPlus}>+</div>
    </button>
  );
}

function GroupSections({ groups, onCreateClick }) {
  const ownedGroups = groups.filter((g) => g.role === 'owner');
  const joinedGroups = groups.filter((g) => g.role !== 'owner');

  // Hero: the group with the most COMPLETED tasks (real progress signal).
  // Require >= 5 completed tasks to avoid celebrating empty groups.
  // Only apply with 3+ groups to avoid odd layout with 1-2 cards.
  const mostActiveId = groups.length >= 3
    ? groups.reduce((best, g) => {
        if ((g.tasksDone || 0) < 5) return best;
        return (g.tasksDone || 0) > (best?.tasksDone || 0) ? g : best;
      }, null)?.id
    : null;

  return (
    <div>
      {ownedGroups.length > 0 && (
        <>
          <div className={styles.sectionCaption}>§ Your groups</div>
          <div className={styles.groupsGrid}>
            {ownedGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isHero={group.id === mostActiveId}
              />
            ))}
            {joinedGroups.length === 0 && (
              <CreateCard onClick={onCreateClick} />
            )}
          </div>
        </>
      )}
      {joinedGroups.length > 0 && (
        <>
          <div className={styles.sectionCaption}>§ Joined groups</div>
          <div className={styles.groupsGrid}>
            {joinedGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isHero={group.id === mostActiveId}
              />
            ))}
            <CreateCard onClick={onCreateClick} />
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
      const groupIds = memberData.map((m) => m.group_id);

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
        supabase
          .from('group_members')
          .select('group_id, user_id')
          .in('group_id', groupIds),
        supabase
          .from('tasks')
          .select('group_id, status')
          .in('group_id', groupIds),
      ]);

      if (membersResult.error) throw membersResult.error;
      if (tasksResult.error) throw tasksResult.error;

      // Collect all unique user IDs across groups for profile fetch
      const allUserIds = [
        ...new Set((membersResult.data || []).map((m) => m.user_id)),
      ];

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

      // Build per-group task stats (todo / doing / done) so the editorial
      // card can render the three-column breakdown that mirrors lockin-test.
      const taskStatsByGroup = (tasksResult.data || []).reduce((acc, row) => {
        if (!acc[row.group_id]) {
          acc[row.group_id] = { total: 0, todo: 0, doing: 0, done: 0 };
        }
        acc[row.group_id].total += 1;
        if (row.status === 'todo') acc[row.group_id].todo += 1;
        else if (row.status === 'in_progress') acc[row.group_id].doing += 1;
        else if (row.status === 'done') acc[row.group_id].done += 1;
        return acc;
      }, {});

      const groupsWithCounts = (groupsData || []).map((group) => {
        const membership = memberData.find((m) => m.group_id === group.id);
        const groupMembers = membersByGroup[group.id] || [];
        const taskStats = taskStatsByGroup[group.id] || {
          total: 0,
          todo: 0,
          doing: 0,
          done: 0,
        };

        return {
          ...group,
          role: membership?.role || 'member',
          memberCount: groupMembers.length,
          members: groupMembers,
          taskCount: taskStats.total,
          tasksTodo: taskStats.todo,
          tasksDoing: taskStats.doing,
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
    setGroups((prev) => [
      ...prev,
      {
        ...newGroup,
        role: 'owner',
        memberCount: 1,
        members: [{ user_id: user.id, full_name: null, avatar_url: null }],
        taskCount: 0,
        tasksDone: 0,
      },
    ]);
  };

  const handleGroupJoined = () => {
    fetchGroups(); // Refresh to get accurate counts
  };

  return (
    <div className={styles.container}>
      {/* Editorial header — § GROUPS caption + hero serif title + CTAs */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerCaption}>§ GROUPS</div>
          <h1 className={styles.headerTitle}>
            Who&rsquo;s moving,
            <br />who isn&rsquo;t.
          </h1>
          <p className={styles.headerSubtitle}>
            Shared boards. Every task stamped with an owner. If a card hasn&rsquo;t
            moved in a week, the group notices — because everyone can see.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => setIsJoinModalOpen(true)}
          >
            Join Group
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setIsCreateModalOpen(true)}
          >
            + New group
          </button>
        </div>
      </div>

      {/* Groups List */}
      {error ? (
        <EmptyState
          floating={false}
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
          title="Better together. Way better."
          description="Start a group to lock in with friends and hold each other accountable."
          action={{
            label: '+ Create your first group',
            onClick: () => setIsCreateModalOpen(true),
          }}
          secondaryAction={
            <button
              type="button"
              className={styles.emptyActionSecondary}
              onClick={() => setIsJoinModalOpen(true)}
            >
              Join a group
            </button>
          }
        />
      ) : (
        <GroupSections
          groups={groups}
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
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
