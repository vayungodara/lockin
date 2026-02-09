'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getActivityHeatmap, calculateStreak } from '@/lib/streaks';
import { staggerContainer, staggerItem } from '@/lib/animations';
import styles from './MonthlyCalendar.module.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MonthlyCalendar({ userId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [slideDirection, setSlideDirection] = useState(0);
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
      console.error('Error fetching calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData]);

  // Build lookup map for quick access
  const dataLookup = useMemo(() => {
    const map = {};
    heatmapData.forEach(day => {
      map[day.date] = day;
    });
    return map;
  }, [heatmapData]);

  // Get days for the current month view
  const getMonthDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Day of week for first day (0 = Sunday, convert to Monday-based)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days = [];

    // Add padding days from previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Add padding days to complete 6 rows (42 days total)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const canGoNext = () => {
    const today = new Date();
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    return nextMonth <= new Date(today.getFullYear(), today.getMonth() + 1, 1);
  };

  const navigateMonth = (direction) => {
    setSlideDirection(direction);
    setSelectedDay(null);
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const handleDayClick = (date, dayData) => {
    if (isFutureDate(date)) return;

    const dateKey = formatDateKey(date);
    if (selectedDay?.dateKey === dateKey) {
      setSelectedDay(null);
    } else {
      setSelectedDay({
        dateKey,
        date,
        data: dayData
      });
    }
  };

  const formatSelectedDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const monthDays = getMonthDays();

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0
    })
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading activity...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Activity Calendar
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

      {/* Month Navigation */}
      <div className={styles.monthNav}>
        <button
          className={styles.navBtn}
          onClick={() => navigateMonth(-1)}
          aria-label="Previous month"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className={styles.monthTitle}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          className={`${styles.navBtn} ${!canGoNext() ? styles.navBtnDisabled : ''}`}
          onClick={() => canGoNext() && navigateMonth(1)}
          disabled={!canGoNext()}
          aria-label="Next month"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarSection}>
        {/* Weekday Headers */}
        <div className={styles.weekdayRow}>
          {WEEKDAYS.map(day => (
            <div key={day} className={styles.weekdayLabel}>{day}</div>
          ))}
        </div>

        {/* Days Grid */}
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={`${currentMonth.getMonth()}-${currentMonth.getFullYear()}`}
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={styles.daysGrid}
          >
            {monthDays.map(({ date, isCurrentMonth }, index) => {
              const dateKey = formatDateKey(date);
              const dayData = dataLookup[dateKey];
              const level = dayData?.level || 0;
              const isTodayDate = isToday(date);
              const isFuture = isFutureDate(date);
              const isSelected = selectedDay?.dateKey === dateKey;

              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.008, duration: 0.2 }}
                  className={`
                    ${styles.dayCell}
                    ${!isCurrentMonth ? styles.otherMonth : ''}
                    ${styles[`level${level}`]}
                    ${isTodayDate ? styles.today : ''}
                    ${isFuture ? styles.future : ''}
                    ${isSelected ? styles.selected : ''}
                  `}
                  onClick={() => handleDayClick(date, dayData)}
                  role="button"
                  tabIndex={isFuture ? -1 : 0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDayClick(date, dayData); } }}
                  aria-label={`${date.getDate()} - ${dayData ? `${dayData.count} activities` : 'No activity'}`}
                >
                  <span className={styles.dayNumber}>{date.getDate()}</span>
                  {dayData && dayData.count > 0 && (
                    <span className={styles.activityDot} />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            className={styles.detailPanel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.detailContent}>
              <div className={styles.detailHeader}>
                <span className={styles.detailDate}>{formatSelectedDate(selectedDay.date)}</span>
                <button
                  className={styles.detailClose}
                  onClick={() => setSelectedDay(null)}
                  aria-label="Close details"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              {selectedDay.data && selectedDay.data.count > 0 ? (
                <motion.div
                  className={styles.detailStats}
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  <motion.div className={styles.detailStat} variants={staggerItem}>
                    <span className={styles.detailIcon}>✓</span>
                    <span className={styles.detailValue}>{selectedDay.data.pactCount}</span>
                    <span className={styles.detailLabel}>pact{selectedDay.data.pactCount !== 1 ? 's' : ''} completed</span>
                  </motion.div>
                  <motion.div className={styles.detailStat} variants={staggerItem}>
                    <span className={styles.detailIcon}>⏱</span>
                    <span className={styles.detailValue}>{selectedDay.data.focusCount}</span>
                    <span className={styles.detailLabel}>focus session{selectedDay.data.focusCount !== 1 ? 's' : ''}</span>
                  </motion.div>
                </motion.div>
              ) : (
                <div className={styles.detailEmpty}>
                  <span>No activity recorded</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
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
