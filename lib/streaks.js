/**
 * Format a Date as a UTC date string (YYYY-MM-DD).
 * Using UTC everywhere ensures streak calculations are consistent
 * between client (Stats page) and server (Share page, cron jobs).
 */
export function formatUTCDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date as a local date string (YYYY-MM-DD).
 * Used only for display purposes (heatmap calendar).
 */
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date as a date string (YYYY-MM-DD) in the given IANA timezone.
 * Falls back to UTC if the timezone is invalid or not provided.
 *
 * This is the core fix for the timezone bug: a user at UTC-8 completing
 * a pact at 11pm local time should have their activity recorded under
 * that local date, not the next UTC day.
 *
 * @param {Date} date
 * @param {string} [timezone='UTC'] - IANA timezone (e.g. 'America/Los_Angeles')
 * @returns {string} YYYY-MM-DD in the user's local date
 */
export function formatDateInTimezone(date, timezone = 'UTC') {
  try {
    // toLocaleDateString with en-CA gives YYYY-MM-DD natively
    return date.toLocaleDateString('en-CA', { timeZone: timezone });
  } catch {
    // Invalid timezone string — fall back to UTC
    return formatUTCDate(date);
  }
}

/**
 * Get the current hour (0-23) in the given IANA timezone.
 *
 * @param {Date} date
 * @param {string} [timezone='UTC']
 * @returns {number}
 */
export function getHourInTimezone(date, timezone = 'UTC') {
  try {
    return parseInt(
      date.toLocaleString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      }),
      10
    );
  } catch {
    return date.getUTCHours();
  }
}

/**
 * Calculate streak stats for a user.
 *
 * @param {object} supabase - Supabase client
 * @param {string} userId
 * @param {string} [timezone='UTC'] - IANA timezone for date bucketing
 * @returns {Promise<{currentStreak: number, longestStreak: number, totalCompleted: number}>}
 */
export async function calculateStreak(supabase, userId, timezone = 'UTC') {
  try {
    const { data: pacts, error } = await supabase
      .from('pacts')
      .select('completed_at, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    if (!pacts || pacts.length === 0) return { currentStreak: 0, longestStreak: 0, totalCompleted: 0 };

    // Bucket each completion into the user's local date so an 11pm
    // completion in UTC-8 counts as that day, not the next UTC day.
    const completedDates = [...new Set(
      pacts.map(p => formatDateInTimezone(new Date(p.completed_at), timezone))
    )].sort((a, b) => new Date(b) - new Date(a));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const now = new Date();
    const todayStr = formatDateInTimezone(now, timezone);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateInTimezone(yesterday, timezone);

    if (completedDates[0] === todayStr || completedDates[0] === yesterdayStr) {
      currentStreak = 1;
      let prevDate = new Date(completedDates[0]);

      for (let i = 1; i < completedDates.length; i++) {
        const currDate = new Date(completedDates[i]);
        const diffDays = Math.round((prevDate - currDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
          prevDate = currDate;
        } else {
          break;
        }
      }
    }

    tempStreak = 1;
    for (let i = 1; i < completedDates.length; i++) {
      const prevDate = new Date(completedDates[i - 1]);
      const currDate = new Date(completedDates[i]);
      const diffDays = Math.round((prevDate - currDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
      currentStreak,
      longestStreak,
      totalCompleted: pacts.length
    };
  } catch (err) {
    console.error('Error calculating streak:', err);
    return { currentStreak: 0, longestStreak: 0, totalCompleted: 0 };
  }
}

/**
 * Build the activity heatmap for a user.
 *
 * @param {object} supabase
 * @param {string} userId
 * @param {number} [days=365]
 * @param {string} [timezone='UTC'] - IANA timezone for date bucketing
 */
export async function getActivityHeatmap(supabase, userId, days = 365, timezone = 'UTC') {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const { data: pacts, error: pactsError } = await supabase
      .from('pacts')
      .select('completed_at, status')
      .eq('user_id', userId)
      .gte('completed_at', startDate.toISOString());

    if (pactsError) throw pactsError;

    const { data: focusSessions, error: focusError } = await supabase
      .from('focus_sessions')
      .select('started_at, duration_minutes')
      .eq('user_id', userId)
      .gte('started_at', startDate.toISOString());

    if (focusError) throw focusError;

    const activityMap = {};

    // Bucket into user's timezone so the heatmap matches their local day
    (pacts || []).forEach(p => {
      if (p.completed_at) {
        const date = formatDateInTimezone(new Date(p.completed_at), timezone);
        if (!activityMap[date]) {
          activityMap[date] = { pacts: 0, focus: 0 };
        }
        activityMap[date].pacts += 1;
      }
    });

    (focusSessions || []).forEach(s => {
      if (s.started_at) {
        const date = formatDateInTimezone(new Date(s.started_at), timezone);
        if (!activityMap[date]) {
          activityMap[date] = { pacts: 0, focus: 0 };
        }
        activityMap[date].focus += 1;
      }
    });

    const heatmapData = [];
    const current = new Date();
    current.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(current);
      date.setDate(date.getDate() - i);
      const dateStr = formatDateInTimezone(date, timezone);

      const dayData = activityMap[dateStr] || { pacts: 0, focus: 0 };
      const weightedScore = (dayData.pacts * 2) + dayData.focus;

      heatmapData.push({
        date: dateStr,
        count: dayData.pacts + dayData.focus,
        pactCount: dayData.pacts,
        focusCount: dayData.focus,
        level: getActivityLevel(weightedScore)
      });
    }

    return { data: heatmapData, error: null };
  } catch (err) {
    console.error('Error getting heatmap:', err);
    return { data: [], error: err };
  }
}

function getActivityLevel(count) {
  if (count === 0) return 0;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}
