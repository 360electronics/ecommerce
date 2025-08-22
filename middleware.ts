import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authProtectedRoutes = ["/profile", "/cart", "/checkout", "/wishlist"];
const adminRoutes = ["/admin"];
const nonAuthRoutes = ["/signin", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get authToken from cookies
  const token = request.cookies.get("authToken")?.value;

  let isAuthenticated = false;
  let isAdmin = false;

  if (token) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `${request.nextUrl.origin}/api/auth/status`,
        {
          method: "GET",
          headers: {
            Cookie: `authToken=${token}`,
            'Cache-Control': 'no-cache', // Prevent caching issues
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        isAuthenticated = data.isAuthenticated;
        if (data.user && data.user.role === "admin") {
          isAdmin = true;
        }
      } else {
        console.warn("Auth status check failed:", response.status, await response.text());
        // If auth check fails, don't immediately redirect - let client handle it
        // unless it's clearly an unauthorized request
        if (response.status === 401 || response.status === 403) {
          isAuthenticated = false;
        }
      }
    } catch (error) {
      console.error("Error checking auth status in middleware:", error);
      // On error, be more lenient - don't block navigation
      // Let the client-side auth store handle the state
    }
  }

  // Case 1: User tries to access auth-protected routes without being logged in
  if (
    authProtectedRoutes.some((route) => pathname.startsWith(route)) &&
    !isAuthenticated &&
    token // Only redirect if there's no token at all
  ) {
    return redirectToSignIn(request);
  }

  // Case 2: User tries to access admin routes without being an admin
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return redirectToSignIn(request);
    }
    if (!isAdmin) {
      return redirectToHome(request);
    }
  }

  // Case 3: Authenticated user tries to access sign in or sign up pages
  if (
    nonAuthRoutes.some((route) => pathname === route) &&
    isAuthenticated
  ) {
    return redirectToHome(request);
  }

  // Add headers to help with caching and state management
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

// Helper function to redirect to sign in page
function redirectToSignIn(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.searchParams.set("callbackUrl", request.nextUrl.pathname);
  url.pathname = "/signin";
  return NextResponse.redirect(url);
}

// Helper function to redirect to home page
function redirectToHome(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
}

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
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};