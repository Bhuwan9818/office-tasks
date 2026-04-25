// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const sessionCookie = request.cookies.get('office_tasks_session');
  const { pathname } = request.nextUrl;

  // Protect /dashboard — redirect to login if no session cookie
  if (pathname.startsWith('/dashboard') && !sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect logged-in users away from login page
  if (pathname === '/' && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
