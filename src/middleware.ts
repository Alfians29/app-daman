import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/sign-in',
  '/sign-in/login',
  '/api/auth/login',
  '/api/auth/logout',
];

// API routes that should be accessible without auth
const publicApiRoutes = ['/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.includes('.') // Files with extensions (images, etc.)
  ) {
    return NextResponse.next();
  }

  // For client-side authentication check, we'll handle it in the app
  // The middleware just ensures API routes work properly
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
};
