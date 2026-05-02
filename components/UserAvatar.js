'use client';

import Image from 'next/image';
import styles from './UserAvatar.module.css';

/**
 * UserAvatar — the witness-tile primitive from the editorial redesign.
 *
 * Renders either a 2-letter initial tile (in the user's ink) or a Google
 * profile photo, inside a 2px-radius square-ish surface (not a circle —
 * matches the notebook/paper brief).
 *
 * Default behavior (matches .impeccable.md — initial-tile primary):
 *   `showPhoto` defaults to FALSE. The witness-tile (2-letter initial on an
 *   ink-colored square) is the default brand-consistent avatar everywhere
 *   — activity feed, pact witnesses, group rows, friend list.
 *
 *   Callers that want the actual Google profile photo (the user's own
 *   profile page, header avatar-menu, settings) pass `showPhoto`. When
 *   `showPhoto` is true AND `avatar_url` is present, the photo renders.
 *   Otherwise, the initial tile is shown.
 *
 *   `preferInitials` is kept as a redundant explicit override for callers
 *   that want to force the tile regardless of other props.
 *
 * Fallback ink:
 *   1. user.accent_color  — explicit user preference
 *   2. stamp-yellow       — when this avatar is the current user
 *   3. hashToAccent(id)   — stable per-user color derived from id
 *
 * @example
 *   // activity feed / pact witnesses / groups — just `user` is enough
 *   <UserAvatar user={user} size="sm" />
 *
 *   // own profile page — show the uploaded Google photo
 *   <UserAvatar user={user} size="lg" showPhoto />
 *
 *   // focused state in a group row
 *   <UserAvatar user={user} ring />
 *
 * @param {Object} props
 * @param {Object} props.user — { id, name | full_name, avatar_url, accent_color? }
 * @param {"xs"|"sm"|"md"|"lg"} [props.size="md"]
 * @param {boolean} [props.ring=false] — highlighter outline for focused state
 * @param {boolean} [props.showPhoto=false] — opt-in to Google photo (default: initial tile)
 * @param {boolean} [props.preferInitials=false] — redundant explicit override to force tile
 * @param {boolean} [props.isSelf=false] — treat as current user (→ highlighter ink)
 * @param {string} [props.className]
 */
export default function UserAvatar({
  user,
  size = 'md',
  ring = false,
  showPhoto = false,
  preferInitials = false,
  isSelf = false,
  className = '',
}) {
  if (!user) return null;

  const displayName = user.name || user.full_name || 'User';
  const avatarUrl = user.avatar_url;
  const usePhoto = showPhoto && !preferInitials && Boolean(avatarUrl);

  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;
  const pixelSize = SIZE_PIXELS[size] || SIZE_PIXELS.md;
  const classNames = [styles.tile, styles[sizeClass], ring && styles.ring, className]
    .filter(Boolean)
    .join(' ');

  if (usePhoto) {
    return (
      <span className={classNames} aria-label={displayName}>
        <Image
          src={avatarUrl}
          alt={displayName}
          width={pixelSize}
          height={pixelSize}
          className={styles.photo}
          unoptimized
        />
      </span>
    );
  }

  const initials = deriveInitials(displayName);
  const ink = resolveInk(user, isSelf);

  return (
    <span
      className={classNames}
      style={{ background: ink.bg, color: ink.fg }}
      aria-label={displayName}
    >
      {initials}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Initials — first + last first-letter, else two letters of the only name
   ------------------------------------------------------------------------- */
function deriveInitials(name) {
  if (!name) return '??';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) {
    const only = parts[0];
    return (only.slice(0, 2) || only[0] + only[0]).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* -------------------------------------------------------------------------
   Ink resolution — accent_color > stamp-yellow (self) > hashToAccent(id)

   Uses OKLCH custom-property references so the tile inherits the
   user's active ink theme when available. The hash fallback picks from
   the 5-ink palette baked into globals.css.
   ------------------------------------------------------------------------- */
function resolveInk(user, isSelf) {
  // Explicit per-user accent (takes priority — personalized identity)
  if (user.accent_color) {
    return { bg: user.accent_color, fg: getContrastInk(user.accent_color) };
  }

  if (isSelf) {
    return { bg: 'var(--stamp-yellow)', fg: 'var(--stamp-yellow-ink)' };
  }

  // Stable hash → one of 5 distinct inks
  const palette = hashToAccent(user.id || user.name || 'anon');
  return palette;
}

/* Map a string id to one of five brand inks (Highlighter, Red Pen, Carbon,
   Moss, Indigo). Stable per id — same user always gets the same color. */
const INK_PALETTE = [
  { bg: 'var(--stamp-yellow)', fg: 'var(--stamp-yellow-ink)' },
  { bg: 'var(--stamp-red)', fg: 'oklch(0.99 0.005 60)' },
  { bg: 'var(--stamp-blue)', fg: 'oklch(0.99 0.005 260)' },
  { bg: 'var(--stamp-green)', fg: 'oklch(0.99 0.005 140)' },
  { bg: 'oklch(0.58 0.19 278)', fg: 'oklch(0.99 0.005 280)' }, // indigo legacy
];

function hashToAccent(str) {
  const s = String(str || '');
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    // Classic 32-bit string hash — stable across browsers/server
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % INK_PALETTE.length;
  return INK_PALETTE[index];
}

/* Trivial contrast pick for explicit hex `accent_color` values. Good enough
   for witness tiles — not a color-science problem. */
function getContrastInk(color) {
  const hex = String(color).trim();
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    return 'var(--ink-000)';
  }
  const full = hex.length === 4
    ? '#' + [...hex.slice(1)].map((c) => c + c).join('')
    : hex;
  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  // Perceived luminance — dark ink on light tiles, cream on dark tiles.
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? 'var(--ink-900)' : 'var(--ink-000)';
}

const SIZE_CLASS = {
  xs: 'tileXs',
  sm: 'tileSm',
  md: 'tileMd',
  lg: 'tileLg',
};

const SIZE_PIXELS = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
};
