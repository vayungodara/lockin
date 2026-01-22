function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function calculateStreak(supabase, userId) {
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

    const completedDates = [...new Set(
      pacts.map(p => formatLocalDate(new Date(p.completed_at)))
    )].sort((a, b) => new Date(b) - new Date(a));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = formatLocalDate(today);
    const yesterdayStr = formatLocalDate(yesterday);

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

export async function getActivityHeatmap(supabase, userId, days = 365) {
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
    
    (pacts || []).forEach(p => {
      if (p.completed_at) {
        const date = formatLocalDate(new Date(p.completed_at));
        activityMap[date] = (activityMap[date] || 0) + 2;
      }
    });

    (focusSessions || []).forEach(s => {
      if (s.started_at) {
        const date = formatLocalDate(new Date(s.started_at));
        activityMap[date] = (activityMap[date] || 0) + 1;
      }
    });

    const heatmapData = [];
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(current);
      date.setDate(date.getDate() - i);
      const dateStr = formatLocalDate(date);
      
      heatmapData.push({
        date: dateStr,
        count: activityMap[dateStr] || 0,
        level: getActivityLevel(activityMap[dateStr] || 0)
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
