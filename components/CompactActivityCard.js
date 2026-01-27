'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getActivityHeatmap, calculateStreak } from '@/lib/streaks';
import styles from './CompactActivityCard.module.css';

export default function CompactActivityCard({ userId }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      
      try {
        const [heatmap, streak] = await Promise.all([
          getActivityHeatmap(supabase, userId, 14),
          calculateStreak(supabase, userId)
        ]);
        
        setHeatmapData(heatmap.data || []);
        setStreakData(streak);
      } catch (err) {
        console.error('Error fetching activity data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [userId, supabase]);

  useEffect(() => {
    const handleClickOutside = () => setHoveredDay(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDayClick = (day, e) => {
    e.stopPropagation();
    if (day && !day.isEmpty) {
      setHoveredDay(hoveredDay?.date === day.date ? null : day);
    }
  };

  const handleDayHover = (day) => {
    if (day && !day.isEmpty) {
      setHoveredDay(day);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const weeks = useMemo(() => {
    if (!heatmapData.length) return [];
    
    const weeksArray = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      const weekData = heatmapData.slice(i, i + 7);
      const paddedWeek = weekData.map(day => ({ ...day, id: day.date }));
      
      // Fill remaining days to ensure 7 columns
      while (paddedWeek.length < 7) {
        paddedWeek.push({ 
          id: `empty-${i}-${paddedWeek.length}`, 
          level: 0, 
          isEmpty: true 
        });
      }
      weeksArray.push(paddedWeek);
    }
    return weeksArray;
  }, [heatmapData]);

  const hasNoActivity = heatmapData.every(day => day.count === 0) && streakData.currentStreak === 0;

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.loading}>Loading activity...</div>
      </div>
    );
  }

  return (
    <motion.div 
      className={styles.card}
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        hover: { y: -3 }
      }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.header}>
        <div className={styles.streakMain}>
          <span className={styles.fireIcon}>🔥</span>
          <span className={styles.streakCount}>{streakData.currentStreak}</span>
          <span className={styles.streakLabel}>day streak</span>
        </div>
        
        <div className={styles.streakBest}>
          <span className={styles.trophyIcon}>🏆</span>
          <span>Best: {streakData.longestStreak}</span>
        </div>
      </div>

      <div className={styles.heatmapSection}>
        {hasNoActivity ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>✨</span>
            <p className={styles.emptyTitle}>Start your streak today!</p>
            <p className={styles.emptySubtitle}>Complete a pact to begin</p>
          </div>
        ) : (
          <>
            <div className={styles.weekDays}>
              <span className={styles.dayLabel}>M</span>
              <span className={styles.dayLabel}>T</span>
              <span className={styles.dayLabel}>W</span>
              <span className={styles.dayLabel}>T</span>
              <span className={styles.dayLabel}>F</span>
              <span className={styles.dayLabel}>S</span>
              <span className={styles.dayLabel}>S</span>
            </div>

            <div className={styles.grid}>
              {weeks.map((week) => (
                <div key={week[0].id} className={styles.weekRow}>
                  {week.map((day) => (
                    <div 
                      key={day.id}
                      className={`${styles.dayCell} ${styles[`level${day.level}`]}`}
                      onClick={(e) => handleDayClick(day, e)}
                      onMouseEnter={() => handleDayHover(day)}
                      role={day.isEmpty ? undefined : "button"}
                      tabIndex={day.isEmpty ? undefined : 0}
                      onKeyDown={(e) => e.key === 'Enter' && handleDayClick(day, e)}
                    >
                      {hoveredDay && hoveredDay.date === day.date && (
                        <div className={styles.tooltip}>
                          <strong>{day.count} {day.count === 1 ? 'activity' : 'activities'}</strong>
                          <span>{formatDate(day.date)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
