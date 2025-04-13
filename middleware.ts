import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authProtectedRoutes = ['/profile', '/cart', '/checkout', '/wishlist'];

const adminRoutes = ['/admin'];

const nonAuthRoutes = ['/signin', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const token = request.cookies.get('authToken')?.value;
  const userRole = request.cookies.get('userRole')?.value || 'user';
  
  const isAuthenticated = !!token;
  const isAdmin = userRole === 'admin';

  // Case 1: User tries to access auth-protected routes without being logged in
  if (authProtectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    return redirectToSignIn(request);
  }

  // Case 2: User tries to access admin routes without being an admin
  if (adminRoutes.some(route => pathname.startsWith(route)) && (!isAuthenticated || !isAdmin)) {

    if (!isAuthenticated) {
      return redirectToSignIn(request);
    }
    return redirectToHome(request);
  }

  // Case 3: Authenticated user tries to access sign in or sign up pages
  if (nonAuthRoutes.some(route => pathname === route) && isAuthenticated) {
    return redirectToHome(request);
  }

  return NextResponse.next();
}

// Helper function to redirect to sign in page
function redirectToSignIn(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.searchParams.set('callbackUrl', request.nextUrl.pathname);
  url.pathname = '/signin';
  return NextResponse.redirect(url);
}

// Helper function to redirect to home page
function redirectToHome(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/';
  return NextResponse.redirect(url);
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};