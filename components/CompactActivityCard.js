'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getActivityHeatmap, calculateStreak } from '@/lib/streaks';
import styles from './CompactActivityCard.module.css';

export default function CompactActivityCard({ userId }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);
  
  const supabase = useMemo(() => createClient(), []);

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

  const gridRef = useRef(null);

  const handleClickOutside = useCallback((e) => {
    // Don't close if clicking inside the grid
    if (gridRef.current && gridRef.current.contains(e.target)) {
      return;
    }
    setHoveredDay(null);
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [handleClickOutside]);

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

  const handleGridLeave = () => {
    setHoveredDay(null);
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
    let currentWeek = [];
    
    // Get the weekday of the first date (0 = Sunday, 1 = Monday, etc.)
    const firstDate = new Date(heatmapData[0].date);
    // Convert to Monday-based (0 = Monday, 6 = Sunday)
    const startPadding = (firstDate.getDay() + 6) % 7;
    
    // Add empty cells before first day
    for (let i = 0; i < startPadding; i++) {
      currentWeek.push({ 
        id: `pad-${i}`, 
        level: 0, 
        isEmpty: true 
      });
    }
    
    // Add actual data
    heatmapData.forEach((day) => {
      currentWeek.push({ ...day, id: day.date });
      
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Pad the last week if incomplete
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ 
          id: `empty-end-${currentWeek.length}`, 
          level: 0, 
          isEmpty: true 
        });
      }
      weeksArray.push(currentWeek);
    }
    
    return weeksArray;
  }, [heatmapData]);

  const hasNoActivity = heatmapData.every(day => day.pactCount === 0 && day.focusCount === 0) && streakData.currentStreak === 0;

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

            <div className={styles.grid} ref={gridRef} onMouseLeave={handleGridLeave}>
              {weeks.map((week, weekIndex) => (
                <div key={week[0].id} className={styles.weekRow}>
                  {week.map((day) => {
                    const isTopRow = weekIndex === 0;
                    return (
                      <div
                        key={day.id}
                        className={`${styles.dayCell} ${styles[`level${day.level}`]}`}
                        onClick={(e) => handleDayClick(day, e)}
                        onMouseEnter={() => handleDayHover(day)}
                        role={day.isEmpty ? undefined : "button"}
                        tabIndex={day.isEmpty ? undefined : 0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleDayClick(day, e)}
                      >
                        {hoveredDay && hoveredDay.date === day.date && (
                          <div className={`${styles.tooltip} ${isTopRow ? styles.tooltipBelow : ''}`}>
                            <span className={styles.tooltipDate}>{formatDate(day.date)}</span>
                            {day.pactCount > 0 && (
                              <span className={styles.tooltipLine}>
                                ✓ {day.pactCount} pact{day.pactCount !== 1 ? 's' : ''} completed
                              </span>
                            )}
                            {day.focusCount > 0 && (
                              <span className={styles.tooltipLine}>
                                ⏱ {day.focusCount} focus session{day.focusCount !== 1 ? 's' : ''}
                              </span>
                            )}
                            {day.pactCount === 0 && day.focusCount === 0 && (
                              <span className={styles.tooltipLine}>No activity</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
