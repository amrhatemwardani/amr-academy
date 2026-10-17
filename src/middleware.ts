import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const PUBLIC_PATHS = [
  '/',             // landing page (exact root after locale strip)
  '/login',
  '/forgot-password',
  '/reset-password',
  '/apply',        // admission form
  '/hall-of-fame', // public leaderboard
  '/verify',       // certificate verification
]
const API_PATHS = ['/api/']

function isPublicPath(pathname: string): boolean {
  // Strip locale prefix for matching
  const withoutLocale = pathname.replace(/^\/(en|ar)/, '') || '/'
  return PUBLIC_PATHS.some(p => {
    if (p === '/') return withoutLocale === '/'  // exact match for root
    return withoutLocale.startsWith(p)
  })
}

function isApiPath(pathname: string): boolean {
  return API_PATHS.some(p => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes: handle CORS / cron secret but don't redirect
  if (isApiPath(pathname)) {
    return NextResponse.next()
  }

  // Create a mutable response to allow Supabase SSR to set cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // ── Supabase session refresh ─────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session. This is critical — it keeps the session alive.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Apply next-intl middleware (locale detection + routing)
  const intlResponse = intlMiddleware(request)

  // If intl redirects (e.g. missing locale prefix), honour that
  if (intlResponse.status !== 200) {
    return intlResponse
  }

  // Strip locale prefix from pathname for logic below
  const localelessPath = pathname.replace(/^\/(en|ar)/, '') || '/'
  const locale = pathname.startsWith('/ar') ? 'ar' : 'en'

  // ── Handle /change-password specifically ─────────────────────────
  if (localelessPath.startsWith('/change-password')) {
    if (!user) {
      // Must be logged in to change password
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
    // Allow logged-in user to view the change-password page! NEVER redirect away!
    return response
  }

  // ── Public paths: allow through ─────────────────────────────────
  if (isPublicPath(pathname)) {
    // If logged in and visiting root '/' or '/login', redirect to their portal/dashboard
    if (user && (localelessPath === '/' || localelessPath.startsWith('/login'))) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, must_change_password')
        .eq('id', user.id)
        .single()

      if (profile) {
        // If must change password, force them directly to /change-password
        if (profile.must_change_password && profile.role === 'student') {
          return NextResponse.redirect(new URL(`/${locale}/change-password`, request.url))
        }

        const home =
          profile.role === 'teacher'
            ? `/${locale}/dashboard`
            : `/${locale}/portal`
        return NextResponse.redirect(new URL(home, request.url))
      }
    }
    return response
  }

  // ── Protected paths: require authentication ──────────────────────
  if (!user) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Role-based & Password Change Route Guard ─────────────────────
  // Read role and must_change_password from DB (authoritative source)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, must_change_password')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Profile missing — sign out and redirect
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  // ── Enforce must_change_password guard ────────────────────────────
  if (profile.must_change_password && profile.role === 'student') {
    // Student MUST change password before accessing any protected page
    if (!localelessPath.startsWith('/change-password')) {
      return NextResponse.redirect(new URL(`/${locale}/change-password`, request.url))
    }
    return response
  }

  const isTeacherRoute = localelessPath.startsWith('/dashboard') ||
    localelessPath.startsWith('/students') ||
    localelessPath.startsWith('/classes') ||
    localelessPath.startsWith('/attendance') ||
    localelessPath.startsWith('/finance') ||
    localelessPath.startsWith('/exams') ||
    localelessPath.startsWith('/question-bank') ||
    localelessPath.startsWith('/reports') ||
    localelessPath.startsWith('/settings') ||
    localelessPath.startsWith('/login-audit') ||
    localelessPath.startsWith('/certificates')

  const isStudentRoute = localelessPath.startsWith('/portal')

  if (isTeacherRoute && profile.role !== 'teacher') {
    return NextResponse.redirect(new URL(`/${locale}/portal`, request.url))
  }

  if (isStudentRoute && profile.role !== 'student') {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
