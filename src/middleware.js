import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/tentang', '/anggota', '/pengumuman']

// Routes that require specific roles (pages NOT listed here are accessible to all authenticated users)
const roleRoutes = {
  '/admin': ['super_admin'],
  '/members': ['super_admin', 'admin', 'pembina', 'sekretaris'],
  '/attendance/verification': ['super_admin', 'admin', 'sekretaris'],
  '/reports': ['super_admin', 'admin', 'pembina', 'sekretaris'],
  '/logs': ['super_admin', 'admin', 'pembina'],
  '/settings': ['super_admin'],
}

export async function middleware(request) {
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Allow public routes
  if (publicRoutes.some(route => pathname === route)) {
    // If logged in and trying to access login, redirect to dashboard
    if (user && pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Allow API routes to handle their own auth
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Allow static assets
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return supabaseResponse
  }

  // Protected routes - redirect to login if not authenticated
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Check role-based access
  if (user) {
    const { data: member } = await supabase
      .from('members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (member) {
      for (const [route, roles] of Object.entries(roleRoutes)) {
        if (pathname.startsWith(route) && !roles.includes(member.role)) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
