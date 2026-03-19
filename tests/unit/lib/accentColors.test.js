import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  ACCENT_PALETTES,
  DEFAULT_PALETTE_ID,
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
