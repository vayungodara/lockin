import { vi } from 'vitest';

/**
 * Create a mock Supabase client for unit tests.
 *
 * Each chainable method (.from, .select, .eq, etc.) returns the same
 * builder object so you can configure what the final call resolves to.
 *
 * Usage:
 *   const { supabase, builder } = createMockSupabase();
 *   builder.mockReturnValue({ data: [...], error: null });
 *   const result = await myFunction(supabase, ...);
 */
export function createMockSupabase() {
  // The "builder" is the chainable query object.
  // Every chain method returns itself, so .from().select().eq() all work.
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    in: vi.fn(),
    not: vi.fn(),
    gte: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),

    // Set what the final awaited value resolves to
    mockReturnValue(value) {
      // Make the builder itself thenable so `await supabase.from(...).select(...)` works
      builder.then = (resolve) => resolve(value);
    },

    // Convenience alias
    mockResolvedValue(value) {
      builder.mockReturnValue(value);
    },
  };

  // Every method returns the builder for chaining
  const chainMethods = [
    'select', 'eq', 'neq', 'in', 'not', 'gte',
    'order', 'range', 'single', 'maybeSingle',
    'insert', 'update', 'delete',
  ];
  chainMethods.forEach((method) => {
    builder[method].mockReturnValue(builder);
  });

  // Default resolved value (no data, no error)
  builder.mockReturnValue({ data: null, error: null });

  // Optional per-call rpc allowlist. When set, rpc() calls for names not in
  // the list throw, so tests catch typos / missing RPCs that would otherwise
  // silently resolve to `{data: null, error: null}`. Opt in per-test via
  // `supabase.__setAllowedRpcs(['foo', 'bar'])`; unset restores lenient mode.
  let allowedRpcs = null;

  const rpcFn = vi.fn((name, args) => {
    if (allowedRpcs && !allowedRpcs.includes(name)) {
      return Promise.reject(
        new Error(`rpc('${name}') not in allowlist — add it to __setAllowedRpcs()`)
      );
    }
    return Promise.resolve({ data: null, error: null });
  });

  const supabase = {
    from: vi.fn(() => builder),
    rpc: rpcFn,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    // Configure the rpc allowlist for a single test. Pass null/undefined to disable.
    __setAllowedRpcs(list) {
      allowedRpcs = Array.isArray(list) ? list : null;
    },
  };

  return { supabase, builder };
}
