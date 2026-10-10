import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Routes that don't require authentication - checked BEFORE any Supabase call
const publicRoutes = ['/', '/login', '/register', '/tentang', '/anggota', '/pengumuman', '/galeri']

export async function middleware(request) {
  const pathname = request.nextUrl.pathname

  // 1. FAST PATH: Skip middleware entirely for public routes (no Supabase call needed)
  const isPublicRoute = publicRoutes.some(route => pathname === route)
  const isApiPublic = pathname.startsWith('/api/public/')
  const isStaticAsset = pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname.includes('.')

  // For truly public routes that don't need session refresh, return immediately
  if (isStaticAsset) {
    return NextResponse.next()
  }

  // 2. Create Supabase client for session refresh (needed for both public and protected)
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. For public API routes, just refresh session and return
  if (isApiPublic) {
    // Refresh session token if exists, but don't block
    try {
      await supabase.auth.getUser()
    } catch {
      // Ignore errors for public routes
    }
    return supabaseResponse
  }

  // 4. Fast-track truly public pages so they NEVER hang if Supabase is down/asleep
  const authRoutes = ['/login', '/register']
  if (isPublicRoute && !authRoutes.includes(pathname)) {
    return supabaseResponse
  }

  // 5. Get user session - with timeout protection (Vercel kills at 25s, so we timeout at 10s)
  let user = null
  try {
    const fetchWithTimeout = Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 10000))
    ])
    const result = await fetchWithTimeout
    user = result.data?.user ?? null
  } catch (error) {
    console.error('Middleware: Supabase auth error/timeout:', error.message)
    // On timeout/error, assume not logged in.
    user = null
  }

  // 6. Auth route handling (login/register)
  if (authRoutes.includes(pathname)) {
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // 6. Allow API routes to handle their own auth
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // 7. Protected routes - redirect to login if not authenticated
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 8. Role-based access is now handled in the dashboard layout (client-side)
  //    This removes the expensive DB query from middleware, fixing the 504 timeout.
  //    The AuthContext already fetches member role data, so dashboard layout
  //    can redirect unauthorized users.

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
