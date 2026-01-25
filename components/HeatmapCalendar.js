'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getActivityHeatmap, calculateStreak } from '@/lib/streaks';
import styles from './HeatmapCalendar.module.css';

export default function HeatmapCalendar({ userId }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [heatmap, streak] = await Promise.all([
        getActivityHeatmap(supabase, userId, 365),
        calculateStreak(supabase, userId)
      ]);
      
      setHeatmapData(heatmap.data || []);
      setStreakData(streak);
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData]);

  const getWeeks = () => {
    const weeks = [];
    let currentWeek = [];
    
    const firstDate = heatmapData.length > 0 ? new Date(heatmapData[0].date) : new Date();
    const startPadding = firstDate.getDay();
    
    for (let i = 0; i < startPadding; i++) {
      currentWeek.push(null);
    }
    
    heatmapData.forEach((day, index) => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getActivityText = (count) => {
    if (count === 0) return 'No activity';
    if (count === 1) return '1 activity';
    return `${count} activities`;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading activity...</div>
      </div>
    );
  }

  const weeks = getWeeks();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Activity Overview
        </h3>
        <div className={styles.streakBadges}>
          <div className={styles.streakBadge}>
            <span className={styles.fireIcon}>🔥</span>
            <span className={styles.streakValue}>{streakData.currentStreak}</span>
            <span className={styles.streakLabel}>day streak</span>
          </div>
          <div className={styles.streakBadge}>
            <span className={styles.trophyIcon}>🏆</span>
            <span className={styles.streakValue}>{streakData.longestStreak}</span>
            <span className={styles.streakLabel}>best</span>
          </div>
          <button 
            className={styles.shareBtn}
            onClick={() => router.push('/share/streak')}
            title="Share your streak"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16,6 12,2 8,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.calendarWrapper}>
        <div className={styles.monthLabels}>
          {months.map((month, i) => (
            <span key={month} className={styles.monthLabel}>{month}</span>
          ))}
        </div>
        
        <div className={styles.calendar}>
          <div className={styles.dayLabels}>
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          
          <div className={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className={styles.week}>
                {week.map((day, dayIndex) => (
                  <div
                    key={day ? day.date : `empty-${weekIndex}-${dayIndex}`}
                    className={`${styles.day} ${day ? styles[`level${day.level}`] : styles.empty}`}
                    onMouseEnter={() => day && setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {hoveredDay && hoveredDay.date === day?.date && (
                      <div className={styles.tooltip}>
                        <strong>{getActivityText(day.count)}</strong>
                        <span>{formatDate(day.date)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.scrollHint}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Swipe to see full calendar</span>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        <div className={`${styles.legendDay} ${styles.level0}`}></div>
        <div className={`${styles.legendDay} ${styles.level1}`}></div>
        <div className={`${styles.legendDay} ${styles.level2}`}></div>
        <div className={`${styles.legendDay} ${styles.level3}`}></div>
        <div className={`${styles.legendDay} ${styles.level4}`}></div>
        <span className={styles.legendLabel}>More</span>
      </div>
    </motion.div>
  );
}
