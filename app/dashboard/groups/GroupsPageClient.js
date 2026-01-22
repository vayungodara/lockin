'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './GroupsPage.module.css';
import Link from 'next/link';
import CreateGroupModal from '@/components/CreateGroupModal';
import JoinGroupModal from '@/components/JoinGroupModal';

export default function GroupsPageClient({ user }) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

      const { data: membersCountsData, error: membersCountsError } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);

      if (membersCountsError) {
        console.error('Member counts error:', membersCountsError);
        throw membersCountsError;
      }

      const { data: taskCountsData, error: taskCountsError } = await supabase
        .from('tasks')
        .select('group_id')
        .in('group_id', groupIds);

      if (taskCountsError) {
        console.error('Task counts error:', taskCountsError);
        throw taskCountsError;
      }

      const memberCounts = (membersCountsData || []).reduce((acc, row) => {
        acc[row.group_id] = (acc[row.group_id] || 0) + 1;
        return acc;
      }, {});

      const taskCounts = (taskCountsData || []).reduce((acc, row) => {
        acc[row.group_id] = (acc[row.group_id] || 0) + 1;
        return acc;
      }, {});

      const groupsWithCounts = (groupsData || []).map((group) => {
        const membership = memberData.find(m => m.group_id === group.id);

        return {
          ...group,
          role: membership?.role || 'member',
          memberCount: memberCounts[group.id] || 0,
          taskCount: taskCounts[group.id] || 0
        };
      });

      setGroups(groupsWithCounts);
    } catch (err) {
      console.error('Error fetching groups:', err);
      console.error('Error message:', err?.message);
      console.error('Error details:', JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleGroupCreated = (newGroup) => {
    setGroups([...groups, { ...newGroup, role: 'owner', memberCount: 1, taskCount: 0 }]);
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
      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading your groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>No groups yet</h3>
          <p>Create a group for your project or join an existing one with an invite code.</p>
          <div className={styles.emptyActions}>
            <button className="btn btn-secondary" onClick={() => setIsJoinModalOpen(true)}>
              Join Group
            </button>
            <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              Create Group
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.groupsGrid}>
          {groups.map((group) => (
            <Link href={`/dashboard/groups/${group.id}`} key={group.id} className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <div className={styles.groupIcon}>
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.groupInfo}>
                  <h3>{group.name}</h3>
                  {group.description && (
                    <p className={styles.groupDescription}>{group.description}</p>
                  )}
                </div>
                {group.role === 'owner' && (
                  <span className={styles.ownerBadge}>Owner</span>
                )}
              </div>
              <div className={styles.groupStats}>
                <div className={styles.groupStat}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                </div>
                <div className={styles.groupStat}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {group.taskCount} task{group.taskCount !== 1 ? 's' : ''}
                </div>
              </div>
            </Link>
          ))}
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
