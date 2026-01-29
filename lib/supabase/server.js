import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 365,
              })
            )
          } catch (error) {
            // Cookie setting can fail in Server Components during initial render
            // This is expected behavior and not an error condition
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie setting skipped (likely in Server Component):', error?.message);
            }
          }
        },
      },
    }
  )
}
