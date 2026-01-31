'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/notifications';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const subscriptionRef = useRef(null);

  // Initial fetch and subscription setup
  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      const [notifResult, countResult] = await Promise.all([
        getNotifications(supabase, 50),
        getUnreadCount(supabase)
      ]);

      if (isMounted) {
        setNotifications(notifResult.data);
        setUnreadCount(countResult.count);
        setIsLoading(false);
      }
    };

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      subscriptionRef.current = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (isMounted) {
              setNotifications(prev => [payload.new, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          }
        )
        .subscribe();
    };

    loadNotifications();
    setupSubscription();

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [supabase]);

  // Mark single notification as read
  const handleMarkAsRead = useCallback(async (notificationId) => {
    const result = await markAsRead(supabase, notificationId);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    return result;
  }, [supabase]);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    const result = await markAllAsRead(supabase);
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
    return result;
  }, [supabase]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    const [notifResult, countResult] = await Promise.all([
      getNotifications(supabase, 50),
      getUnreadCount(supabase)
    ]);
    setNotifications(notifResult.data);
    setUnreadCount(countResult.count);
  }, [supabase]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    refresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
