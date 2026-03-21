import { describe, it, expect } from 'vitest';
import { TEMPLATE_CATEGORIES, PACT_TEMPLATES } from '@/lib/pactTemplates';

const VALID_RECURRENCE_TYPES = ['daily', 'weekly', 'weekdays', 'monthly'];
const REQUIRED_TEMPLATE_FIELDS = [
  'id',
  'title',
  'description',
  'emoji',
  'category',
  'isRecurring',
  'recurrenceType',
  'suggestedTime',
];
const REQUIRED_CATEGORY_FIELDS = ['id', 'label', 'emoji'];

describe('TEMPLATE_CATEGORIES', () => {
  it('exports an array', () => {
    expect(Array.isArray(TEMPLATE_CATEGORIES)).toBe(true);
  });

  it('has exactly 5 categories', () => {
    expect(TEMPLATE_CATEGORIES).toHaveLength(5);
  });

  it('each category has all required fields', () => {
    TEMPLATE_CATEGORIES.forEach((category) => {
      REQUIRED_CATEGORY_FIELDS.forEach((field) => {
        expect(category, `category "${category.id}" is missing field "${field}"`).toHaveProperty(field);
      });
    });
  });

  it('each category field is a non-empty string', () => {
    TEMPLATE_CATEGORIES.forEach((category) => {
      REQUIRED_CATEGORY_FIELDS.forEach((field) => {
        expect(typeof category[field], `category field "${field}" should be a string`).toBe('string');
        expect(category[field].length, `category field "${field}" should not be empty`).toBeGreaterThan(0);
      });
    });
  });

  it('all category IDs are unique', () => {
    const ids = TEMPLATE_CATEGORIES.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('contains the expected category IDs', () => {
    const ids = TEMPLATE_CATEGORIES.map((c) => c.id);
    expect(ids).toContain('academics');
    expect(ids).toContain('health');
    expect(ids).toContain('digital');
    expect(ids).toContain('career');
    expect(ids).toContain('wellness');
  });
});

describe('PACT_TEMPLATES', () => {
  it('exports an array', () => {
    expect(Array.isArray(PACT_TEMPLATES)).toBe(true);
  });

  it('has exactly 20 templates', () => {
    expect(PACT_TEMPLATES).toHaveLength(20);
  });

  it('every template has all required fields', () => {
    PACT_TEMPLATES.forEach((template) => {
      REQUIRED_TEMPLATE_FIELDS.forEach((field) => {
        expect(template, `template "${template.id}" is missing field "${field}"`).toHaveProperty(field);
      });
    });
  });

  it('all template IDs are unique', () => {
    const ids = PACT_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all template IDs are non-empty strings', () => {
    PACT_TEMPLATES.forEach((template) => {
      expect(typeof template.id).toBe('string');
      expect(template.id.length).toBeGreaterThan(0);
    });
  });

  it('all titles and descriptions are non-empty strings', () => {
    PACT_TEMPLATES.forEach((template) => {
      expect(typeof template.title, `template "${template.id}" title should be a string`).toBe('string');
      expect(template.title.length, `template "${template.id}" title should not be empty`).toBeGreaterThan(0);

      expect(typeof template.description, `template "${template.id}" description should be a string`).toBe('string');
      expect(template.description.length, `template "${template.id}" description should not be empty`).toBeGreaterThan(0);
    });
  });

  it('all emoji fields are non-empty strings', () => {
    PACT_TEMPLATES.forEach((template) => {
      expect(typeof template.emoji, `template "${template.id}" emoji should be a string`).toBe('string');
      expect(template.emoji.length, `template "${template.id}" emoji should not be empty`).toBeGreaterThan(0);
    });
  });

  it('every template references a valid category', () => {
    const validCategoryIds = new Set(TEMPLATE_CATEGORIES.map((c) => c.id));
    PACT_TEMPLATES.forEach((template) => {
      expect(
        validCategoryIds.has(template.category),
        `template "${template.id}" has unknown category "${template.category}"`
      ).toBe(true);
    });
  });

  it('isRecurring is a boolean on every template', () => {
    PACT_TEMPLATES.forEach((template) => {
      expect(
        typeof template.isRecurring,
        `template "${template.id}" isRecurring should be a boolean`
      ).toBe('boolean');
    });
  });

  it('every template has a valid recurrenceType', () => {
    PACT_TEMPLATES.forEach((template) => {
      const isValid =
        template.recurrenceType === null ||
        VALID_RECURRENCE_TYPES.includes(template.recurrenceType);
      expect(
        isValid,
        `template "${template.id}" has invalid recurrenceType "${template.recurrenceType}"`
      ).toBe(true);
    });
  });

  it('non-recurring templates have recurrenceType of null', () => {
    PACT_TEMPLATES.filter((t) => !t.isRecurring).forEach((template) => {
      expect(
        template.recurrenceType,
        `non-recurring template "${template.id}" should have recurrenceType null`
      ).toBeNull();
    });
  });

  it('recurring templates have a non-null recurrenceType', () => {
    PACT_TEMPLATES.filter((t) => t.isRecurring).forEach((template) => {
      expect(
        template.recurrenceType,
        `recurring template "${template.id}" should have a non-null recurrenceType`
      ).not.toBeNull();
      expect(VALID_RECURRENCE_TYPES).toContain(template.recurrenceType);
    });
  });

  it('all suggestedTime values match HH:MM format with valid hours and minutes', () => {
    // 24-hour format, leading zeros required, hours 00-23, minutes 00-59
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    PACT_TEMPLATES.forEach((template) => {
      expect(
        timeRegex.test(template.suggestedTime),
        `template "${template.id}" has invalid suggestedTime "${template.suggestedTime}" — expected HH:MM (00-23:00-59)`
      ).toBe(true);
    });
  });
});

describe('PACT_TEMPLATES category coverage', () => {
  it('every category has at least one template', () => {
    TEMPLATE_CATEGORIES.forEach((category) => {
      const templatesInCategory = PACT_TEMPLATES.filter((t) => t.category === category.id);
      expect(
        templatesInCategory.length,
        `category "${category.id}" has no templates`
      ).toBeGreaterThan(0);
    });
  });

  it('academics category has 4 templates', () => {
    const count = PACT_TEMPLATES.filter((t) => t.category === 'academics').length;
    expect(count).toBe(4);
  });

  it('health category has 4 templates', () => {
    const count = PACT_TEMPLATES.filter((t) => t.category === 'health').length;
    expect(count).toBe(4);
  });

  it('digital category has 4 templates', () => {
    const count = PACT_TEMPLATES.filter((t) => t.category === 'digital').length;
    expect(count).toBe(4);
  });

  it('career category has 4 templates', () => {
    const count = PACT_TEMPLATES.filter((t) => t.category === 'career').length;
    expect(count).toBe(4);
  });

  it('wellness category has 4 templates', () => {
    const count = PACT_TEMPLATES.filter((t) => t.category === 'wellness').length;
    expect(count).toBe(4);
  });
});
