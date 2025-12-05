import { getToken } from 'next-auth/jwt'
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req })

    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const isAdmin = token?.role === 'ADMIN'

      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', req.url))
      }

      return null
    }

    // before releasing user dashboard, we restrict access to /user to admins only
    if (req.nextUrl.pathname.startsWith('/awards')) {
      const isAdmin = token?.role === 'ADMIN'

      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', req.url))
      }

      return null
    }

    if (req.nextUrl.pathname.startsWith('/user')) {
      if (!token?.email)
        return NextResponse.redirect(new URL('/sign-in', req.url))

      return null
    }

    if (
      req.nextUrl.pathname === '/sign-up' ||
      req.nextUrl.pathname === '/sign-in'
    ) {
      if (token) return NextResponse.redirect(new URL('/', req.url))

      return null
    }
  },
  {
    callbacks: {
      async authorized() {
        // This is a work-around for handling redirect on auth pages.
        // We return true here so that the middleware function above
        // is always called.
        return true
      },
    },
  },
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sign-up',
    '/sign-in',
    '/user/:path*',
    '/awards',
  ],
}
