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

    if (req.nextUrl.pathname.startsWith('/user')) {
      if (!token?.email)
        return NextResponse.redirect(new URL('/sign-in', req.url))

      return null
    }

    // /sign-in and /sign-up redirect signed-in users themselves, using the
    // session refreshed from the API. Checking only for a cookie here would
    // trap users whose session was revoked (e.g. by a password reset) in a
    // redirect loop, since the revoked cookie still decodes.
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
  matcher: ['/dashboard/:path*', '/user/:path*'],
}
