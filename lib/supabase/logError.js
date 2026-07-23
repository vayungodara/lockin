function getErrorMessage(error) {
  if (!error) return 'Unknown Supabase error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function formatSupabaseError(error) {
  if (!error || typeof error !== 'object') {
    return { message: getErrorMessage(error) };
  }

  return {
    message: getErrorMessage(error),
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    status: error.status ?? error.statusCode ?? null,
    name: error.name ?? null,
  };
}

export function logSupabaseError(label, error, context = {}) {
  const payload = {
    ...context,
    error: formatSupabaseError(error),
  };

  console.error(label, payload);
}
