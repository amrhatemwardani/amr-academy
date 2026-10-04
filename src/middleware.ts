import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password']
const API_PATHS = ['/api/']

function isPublicPath(pathname: string): boolean {
  // Strip locale prefix for matching
  const withoutLocale = pathname.replace(/^\/(en|ar)/, '') || '/'
  return PUBLIC_PATHS.some(p => withoutLocale.startsWith(p))
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

  // ── Public paths: allow through ─────────────────────────────────
  if (isPublicPath(pathname)) {
    // If already logged in, redirect to appropriate home
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        const locale = pathname.startsWith('/ar') ? 'ar' : 'en'
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
    const locale = pathname.startsWith('/ar') ? 'ar' : 'en'
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Role-based route guard ───────────────────────────────────────
  // Read role from DB (not from JWT user_metadata — cannot be trusted)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Profile missing — sign out and redirect
    await supabase.auth.signOut()
    const locale = pathname.startsWith('/ar') ? 'ar' : 'en'
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  const locale = pathname.startsWith('/ar') ? 'ar' : 'en'
  const isTeacherRoute = localelessPath.startsWith('/dashboard') ||
    localelessPath.startsWith('/students') ||
    localelessPath.startsWith('/classes') ||
    localelessPath.startsWith('/attendance') ||
    localelessPath.startsWith('/finance') ||
    localelessPath.startsWith('/exams') ||
    localelessPath.startsWith('/question-bank') ||
    localelessPath.startsWith('/reports') ||
    localelessPath.startsWith('/settings')

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
