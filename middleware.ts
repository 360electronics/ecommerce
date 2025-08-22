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
      // Call /api/auth/status with the authToken cookie
      const response = await fetch(
        `${request.nextUrl.origin}/api/auth/status`,
        {
          method: "GET",
          headers: {
            Cookie: `authToken=${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        isAuthenticated = data.isAuthenticated;
        if (data.user && data.user.role === "admin") {
          isAdmin = true;
        }
      } else {
        console.warn("Auth status check failed:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Error checking auth status in middleware:", error);
    }
  }

  // Case 1: User tries to access auth-protected routes without being logged in
  if (
    authProtectedRoutes.some((route) => pathname.startsWith(route)) &&
    !isAuthenticated
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

  return NextResponse.next();
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