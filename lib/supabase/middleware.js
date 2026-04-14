import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 365,
            })
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user && request.nextUrl.pathname === '/' && !request.nextUrl.searchParams.has('preview')) {
    const url = request.nextUrl.clone()
    url.search = ''

    const returnTo = request.nextUrl.searchParams.get('returnTo')
    let destination = '/dashboard'
    if (
      typeof returnTo === 'string' &&
      returnTo.startsWith('/') &&
      !returnTo.startsWith('//')
    ) {
      try {
        const resolved = new URL(returnTo, request.nextUrl.origin)
        if (resolved.origin === request.nextUrl.origin) {
          destination = returnTo
        }
      } catch {
        // fall through to /dashboard
      }
    }

    const qIdx = destination.indexOf('?')
    url.pathname = qIdx === -1 ? destination : destination.slice(0, qIdx)
    if (qIdx !== -1) url.search = destination.slice(qIdx)

    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365,
      })
    })
    return redirectResponse
  }

  return supabaseResponse
}
