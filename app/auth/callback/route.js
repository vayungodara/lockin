import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Validate redirect path to prevent open redirect attacks
  // Only allow relative paths starting with "/" -- reject absolute URLs,
  // protocol-relative URLs (//evil.com), and anything else an attacker
  // could use to redirect to an external domain.
  let next = searchParams.get('next') ?? '/dashboard'
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) {
    next = '/dashboard'
  }
  try {
    const resolvedUrl = new URL(next, origin)
    if (resolvedUrl.origin !== origin) {
      next = '/dashboard'
    }
  } catch {
    next = '/dashboard'
  }

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 365,
              })
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Use origin from the request URL (safe, server-controlled) or
      // NEXT_PUBLIC_APP_URL as a fallback. Never use x-forwarded-host
      // because it is a user-controlled header that enables open redirects.
      const appOrigin = process.env.NEXT_PUBLIC_APP_URL || origin
      return NextResponse.redirect(`${appOrigin}${next}`)
    } else {
      console.error('Auth callback error:', error.message)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
