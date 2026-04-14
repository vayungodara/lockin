import { describe, it, expect, beforeEach } from 'vitest';
import {
  hexToRgb,
  ACCENT_PALETTES,
  DEFAULT_PALETTE_ID,
  applyAccentToDocument,
} from '@/lib/accentColors';

describe('hexToRgb', () => {
  it('converts black (#000000)', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('converts white (#FFFFFF)', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts pure red (#FF0000)', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts pure green (#00FF00)', () => {
    expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('converts pure blue (#0000FF)', () => {
    expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('converts the brand indigo color (#6366F1)', () => {
    expect(hexToRgb('#6366F1')).toEqual({ r: 99, g: 102, b: 241 });
  });

  it('handles lowercase hex', () => {
    expect(hexToRgb('#ff00ff')).toEqual({ r: 255, g: 0, b: 255 });
  });

  it('handles hex without # prefix', () => {
    expect(hexToRgb('6366F1')).toEqual({ r: 99, g: 102, b: 241 });
  });

  it('returns {0,0,0} for invalid hex', () => {
    expect(hexToRgb('not-a-color')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns {0,0,0} for empty string', () => {
    expect(hexToRgb('')).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe('ACCENT_PALETTES', () => {
  it('has 7 palettes', () => {
    expect(ACCENT_PALETTES).toHaveLength(7);
  });

  it('each palette has required fields', () => {
    ACCENT_PALETTES.forEach((palette) => {
      expect(palette).toHaveProperty('id');
      expect(palette).toHaveProperty('name');
      expect(palette).toHaveProperty('primary');
      expect(palette).toHaveProperty('secondary');
      expect(palette).toHaveProperty('tertiary');
      expect(palette).toHaveProperty('hover');
    });
  });

  it('all palette IDs are unique', () => {
    const ids = ACCENT_PALETTES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all primary colors are valid hex', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    ACCENT_PALETTES.forEach((palette) => {
      expect(palette.primary).toMatch(hexRegex);
    });
  });
});

describe('DEFAULT_PALETTE_ID', () => {
  it('is "indigo"', () => {
    expect(DEFAULT_PALETTE_ID).toBe('indigo');
  });

  it('matches one of the palette IDs', () => {
    const ids = ACCENT_PALETTES.map((p) => p.id);
    expect(ids).toContain(DEFAULT_PALETTE_ID);
  });
});

describe('applyAccentToDocument', () => {
  beforeEach(() => {
    // Reset root inline styles before each test
    const root = document.documentElement;
    root.removeAttribute('style');
  });

  it('sets CSS custom properties for a known palette in light mode', () => {
    applyAccentToDocument('ocean', false);
    const root = document.documentElement;

    const ocean = ACCENT_PALETTES.find((p) => p.id === 'ocean');
    expect(root.style.getPropertyValue('--accent-primary')).toBe(ocean.primary);
    expect(root.style.getPropertyValue('--accent-secondary')).toBe(ocean.secondary);
    expect(root.style.getPropertyValue('--accent-tertiary')).toBe(ocean.tertiary);
    expect(root.style.getPropertyValue('--accent-primary-hover')).toBe(ocean.hover);
    expect(root.style.getPropertyValue('--accent-text')).toBe(ocean.primary);
  });

  it('sets the RGB custom properties derived from the primary and tertiary hex', () => {
    applyAccentToDocument('emerald', false);
    const root = document.documentElement;

    const emerald = ACCENT_PALETTES.find((p) => p.id === 'emerald');
    const pRgb = hexToRgb(emerald.primary);
    const tRgb = hexToRgb(emerald.tertiary);

    expect(root.style.getPropertyValue('--accent-primary-rgb')).toBe(
      `${pRgb.r}, ${pRgb.g}, ${pRgb.b}`
    );
    expect(root.style.getPropertyValue('--accent-tertiary-rgb')).toBe(
      `${tRgb.r}, ${tRgb.g}, ${tRgb.b}`
    );
  });

  it('uses higher alpha values for dark mode glow', () => {
    // First apply in dark mode
    applyAccentToDocument('rose', true);
    const root = document.documentElement;
    const darkGlow = root.style.getPropertyValue('--accent-glow');

    // Then apply in light mode
    applyAccentToDocument('rose', false);
    const lightGlow = root.style.getPropertyValue('--accent-glow');

    // Both should be rgba() with the same RGB but different alpha
    expect(darkGlow).toMatch(/^rgba\(/);
    expect(lightGlow).toMatch(/^rgba\(/);
    expect(darkGlow).not.toBe(lightGlow);
  });

  it('removes inline overrides when paletteId is the default (indigo)', () => {
    // First apply a non-default palette so overrides exist
    applyAccentToDocument('ocean', false);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--accent-primary')).not.toBe('');

    // Then apply the default — overrides should be cleared
    applyAccentToDocument(DEFAULT_PALETTE_ID, false);
    expect(root.style.getPropertyValue('--accent-primary')).toBe('');
    expect(root.style.getPropertyValue('--accent-secondary')).toBe('');
    expect(root.style.getPropertyValue('--gradient-primary')).toBe('');
  });

  it('removes inline overrides when paletteId is falsy', () => {
    applyAccentToDocument('sunset', false);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--accent-primary')).not.toBe('');

    applyAccentToDocument(null, false);
    expect(root.style.getPropertyValue('--accent-primary')).toBe('');
  });

  it('does nothing for an unknown palette id', () => {
    // Seed with a known palette so any accidental overwrite is detectable
    applyAccentToDocument('ocean', false);
    const root = document.documentElement;
    const before = root.style.getPropertyValue('--accent-primary');

    applyAccentToDocument('not-a-real-palette', false);
    const after = root.style.getPropertyValue('--accent-primary');

    expect(after).toBe(before);
  });

  it('builds a valid linear-gradient for --gradient-primary', () => {
    applyAccentToDocument('violet', false);
    const root = document.documentElement;
    const gradient = root.style.getPropertyValue('--gradient-primary');

    expect(gradient).toContain('linear-gradient(135deg,');
    expect(gradient).toContain('0%');
    expect(gradient).toContain('50%');
    expect(gradient).toContain('100%');
  });
});
