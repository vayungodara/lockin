export const ACCENT_PALETTES = [
  { id: 'indigo', name: 'Indigo', primary: '#6366F1', secondary: '#8B5CF6', tertiary: '#D946EF', hover: '#4F46E5' },
  { id: 'ocean', name: 'Ocean', primary: '#3B82F6', secondary: '#06B6D4', tertiary: '#22D3EE', hover: '#2563EB' },
  { id: 'emerald', name: 'Emerald', primary: '#10B981', secondary: '#34D399', tertiary: '#6EE7B7', hover: '#059669' },
  { id: 'sunset', name: 'Sunset', primary: '#F97316', secondary: '#F59E0B', tertiary: '#FBBF24', hover: '#EA580C' },
  { id: 'rose', name: 'Rose', primary: '#F43F5E', secondary: '#EC4899', tertiary: '#F472B6', hover: '#E11D48' },
  { id: 'violet', name: 'Violet', primary: '#8B5CF6', secondary: '#A855F7', tertiary: '#D946EF', hover: '#7C3AED' },
  { id: 'slate', name: 'Slate', primary: '#64748B', secondary: '#94A3B8', tertiary: '#CBD5E1', hover: '#475569' },
];

export const DEFAULT_PALETTE_ID = 'indigo';

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function applyAccentToDocument(paletteId, isDark) {
  const root = document.documentElement;

  if (!paletteId || paletteId === DEFAULT_PALETTE_ID) {
    // Remove inline overrides so CSS defaults show through
    const props = [
      '--accent-primary', '--accent-secondary', '--accent-tertiary',
      '--accent-primary-hover', '--accent-text', '--accent-glow',
      '--accent-primary-rgb', '--accent-tertiary-rgb',
      '--gradient-primary', '--gradient-secondary', '--gradient-subtle', '--gradient-glow',
      '--border-focus', '--shadow-glow', '--shadow-glow-lg',
    ];
    props.forEach((prop) => root.style.removeProperty(prop));
    return;
  }

  const palette = ACCENT_PALETTES.find((p) => p.id === paletteId);
  if (!palette) return;

  const pRgb = hexToRgb(palette.primary);
  const tRgb = hexToRgb(palette.tertiary);

  const glowAlpha = isDark ? 0.2 : 0.15;
  const subtleAlpha = isDark ? 0.12 : 0.08;
  const glowGradAlpha = isDark ? 0.25 : 0.2;
  const focusAlpha = isDark ? 0.6 : 0.5;
  const shadowAlpha = isDark ? 0.2 : 0.15;
  const shadowLgAlpha = isDark ? 0.3 : 0.2;

  root.style.setProperty('--accent-primary', palette.primary);
  root.style.setProperty('--accent-secondary', palette.secondary);
  root.style.setProperty('--accent-tertiary', palette.tertiary);
  root.style.setProperty('--accent-primary-hover', palette.hover);
  root.style.setProperty('--accent-text', palette.primary);
  root.style.setProperty('--accent-glow', `rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, ${glowAlpha})`);
  root.style.setProperty('--accent-primary-rgb', `${pRgb.r}, ${pRgb.g}, ${pRgb.b}`);
  root.style.setProperty('--accent-tertiary-rgb', `${tRgb.r}, ${tRgb.g}, ${tRgb.b}`);
  root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 50%, ${palette.tertiary} 100%)`);
  root.style.setProperty('--gradient-secondary', `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`);
  root.style.setProperty('--gradient-subtle', `linear-gradient(135deg, rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, ${subtleAlpha}) 0%, rgba(${tRgb.r}, ${tRgb.g}, ${tRgb.b}, ${subtleAlpha}) 100%)`);
  root.style.setProperty('--gradient-glow', `linear-gradient(135deg, rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, ${glowGradAlpha}) 0%, rgba(${tRgb.r}, ${tRgb.g}, ${tRgb.b}, ${glowGradAlpha}) 100%)`);
  root.style.setProperty('--border-focus', `rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, ${focusAlpha})`);
  root.style.setProperty('--shadow-glow', `0 0 40px rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, ${shadowAlpha})`);
  root.style.setProperty('--shadow-glow-lg', `0 0 60px rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, ${shadowLgAlpha})`);
}
