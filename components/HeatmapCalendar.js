'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getActivityHeatmap, calculateStreak } from '@/lib/streaks';
import styles from './HeatmapCalendar.module.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HeatmapCalendar({ userId }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);
  const wrapperRef = useRef(null);
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

  useEffect(() => {
    if (wrapperRef.current && !isLoading && heatmapData.length > 0) {
      setTimeout(() => {
        if (wrapperRef.current) {
          wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth;
        }
      }, 100);
    }
  }, [isLoading, heatmapData]);

  const handleClickOutside = useCallback(() => setHoveredDay(null), []);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [handleClickOutside]);

  const getWeeks = useCallback(() => {
    if (heatmapData.length === 0) return [];
    
    const weeks = [];
    let currentWeek = [];
    
    const firstDate = new Date(heatmapData[0].date);
    const startPadding = firstDate.getDay();
    
    for (let i = 0; i < startPadding; i++) {
      currentWeek.push(null);
    }
    
    heatmapData.forEach((day) => {
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
  }, [heatmapData]);

  const getMonthLabels = useCallback((weeks) => {
    const labels = [];
    let currentMonth = null;
    
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find(d => d !== null);
      if (firstDayOfWeek) {
        const month = new Date(firstDayOfWeek.date).getMonth();
        if (month !== currentMonth) {
          labels.push({ 
            name: MONTHS[month], 
            weekIndex 
          });
          currentMonth = month;
        }
      }
    });
    return labels;
  }, []);

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

  const handleDayClick = (day, e) => {
    e.stopPropagation();
    if (day) {
      setHoveredDay(hoveredDay?.date === day.date ? null : day);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading activity...</div>
      </div>
    );
  }

  const weeks = getWeeks();
  const monthLabels = getMonthLabels(weeks);

  return (
    <div className={styles.container}>
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
            type="button"
            className={styles.shareBtn}
            onClick={() => router.push('/share/streak')}
            aria-label="Share your streak"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16,6 12,2 8,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.calendarSection}>
        <div className={styles.scrollWrapper} ref={wrapperRef}>
          <div className={styles.calendarGrid}>
            <div className={styles.monthRow}>
              <div className={styles.dayLabelSpacer} />
              <div className={styles.monthLabels}>
                {monthLabels.map((label, i) => (
                  <span 
                    key={`${label.name}-${i}`} 
                    className={styles.monthLabel}
                    style={{ 
                      gridColumn: label.weekIndex + 1,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
            
            <div className={styles.gridRow}>
              <div className={styles.dayLabels}>
                <span className={styles.dayLabel} />
                <span className={styles.dayLabel}>Mon</span>
                <span className={styles.dayLabel} />
                <span className={styles.dayLabel}>Wed</span>
                <span className={styles.dayLabel} />
                <span className={styles.dayLabel}>Fri</span>
                <span className={styles.dayLabel} />
              </div>
              
              <div className={styles.grid}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className={styles.week}>
                    {week.map((day, dayIndex) => (
                      <div
                        key={day ? day.date : `empty-${weekIndex}-${dayIndex}`}
                        className={`${styles.day} ${day ? styles[`level${day.level}`] : styles.empty}`}
                        onMouseEnter={() => setHoveredDay(day || null)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={(e) => handleDayClick(day, e)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleDayClick(day, e)}
                        role={day ? "button" : undefined}
                        tabIndex={day ? 0 : undefined}
                        aria-label={day ? `${getActivityText(day.count)} on ${formatDate(day.date)}` : undefined}
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
        </div>
        
        <div className={styles.scrollHint}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Swipe to see full year</span>
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        <div className={`${styles.legendDay} ${styles.level0}`} />
        <div className={`${styles.legendDay} ${styles.level1}`} />
        <div className={`${styles.legendDay} ${styles.level2}`} />
        <div className={`${styles.legendDay} ${styles.level3}`} />
        <div className={`${styles.legendDay} ${styles.level4}`} />
        <span className={styles.legendLabel}>More</span>
      </div>
    </div>
  );
}
