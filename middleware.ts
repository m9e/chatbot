import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const allowAnonymous = process.env.ALLOW_ANONYMOUS === 'true'
  const token = request.cookies.get('access_token')?.value
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  // Allow public paths
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.endsWith('.png')
  ) {
    return NextResponse.next()
  }

  // Handle authentication
  if (!token && !allowAnonymous && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}
