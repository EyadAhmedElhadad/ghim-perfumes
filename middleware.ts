import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'ghim_admin_session';
const DEMO_COOKIE = 'ghim_demo_admin';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === '/admin/login';
  const hasSession = Boolean(
    req.cookies.get(SESSION_COOKIE) || req.cookies.get(DEMO_COOKIE),
  );

  if (isLogin && hasSession) {
    return NextResponse.redirect(new URL('/admin/products', req.url));
  }
  if (!isLogin && !hasSession) {
    const url = new URL('/admin/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};