/**
 * Achievement → Phosphor icon map.
 *
 * gamification.js owns the achievement DATA (key/name/description) and still
 * carries an emoji `icon` string used by the notification subsystem — we do
 * NOT touch that. This module is the editorial rendering layer: it maps each
 * achievement key to a Phosphor line-icon so the rail and the profile §03
 * cards render brand-consistent chrome instead of emoji.
 *
 * Icons inherit `currentColor`, so the consuming surface tints them via ink:
 *   earned → --stamp-yellow-ink (on the yellow stamp)
 *   locked → muted ink
 *
 * Phosphor: @phosphor-icons/react ^2.1.10 — same import style the app already
 * uses for Plus / CaretDown / Star / Timer.
 */
import { createElement } from 'react';
import {
  Target,
  Flame,
  Diamond,
  Barbell,
  Star,
  Medal,
  Brain,
  Handshake,
  Butterfly,
  Bird,
  Trophy,
  SealCheck,
} from '@phosphor-icons/react';

/**
 * Keyed by the achievement `key` defined in lib/gamification.js → ACHIEVEMENTS.
 * Keep in sync if a new achievement key is added there.
 */
const ACHIEVEMENT_ICONS = {
  first_pact: Target,          // 🎯 Complete your first pact
  streak_7: Flame,             // 🔥 7-day streak
  streak_30: Diamond,          // 💎 30-day streak
  pacts_10: Barbell,           // 💪 Complete 10 pacts
  pacts_50: Star,              // ⭐ Complete 50 pacts
  pacts_100: Medal,            // 💯 Complete 100 pacts
  focus_10h: Brain,            // 🧠 10 hours of focus time
  team_player: Handshake,      // 🤝 Join your first group
  social_butterfly: Butterfly, // 🦋 React to 50 activities
  early_bird: Bird,            // 🐦 Complete a pact 24h early
  onboarding_complete: Trophy, // 🏆 First Week Challenge
};

/** Fallback for any key not present in the map (e.g. a future achievement). */
export const FALLBACK_ACHIEVEMENT_ICON = SealCheck;

/**
 * Resolve a Phosphor icon component for an achievement key.
 * @param {string} key — achievement key (e.g. 'first_pact')
 * @returns {import('react').ComponentType} Phosphor icon component
 */
export function getAchievementIcon(key) {
  return ACHIEVEMENT_ICONS[key] || FALLBACK_ACHIEVEMENT_ICON;
}

/**
 * Render the Phosphor icon for an achievement key.
 *
 * The icon components are static module-scope references; resolving + rendering
 * here (via createElement) keeps callers from assigning a dynamically-looked-up
 * component to a capitalized local, which the react-hooks/static-components lint
 * rule flags on the otherwise-valid icon-map pattern.
 *
 * @param {Object} props
 * @param {string} props.achievementKey — achievement key from gamification.js
 * @param {number} [props.size] — icon size in px (default 24)
 * @param {string} [props.weight] — Phosphor weight (default 'duotone')
 */
export function AchievementIcon({ achievementKey, size = 24, weight = 'duotone' }) {
  const Icon = getAchievementIcon(achievementKey);
  return createElement(Icon, { size, weight });
}

export default ACHIEVEMENT_ICONS;
