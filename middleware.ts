import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const authProtectedRoutes = ["/profile", "/cart", "/checkout", "/wishlist"]
const adminRoutes = ["/admin"]
const nonAuthRoutes = ["/signin", "/signup"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get authToken from cookies
  const token = request.cookies.get("authToken")?.value

  let isAuthenticated = false
  let isAdmin = false
  let userRole = null

  let response: NextResponse

  if (token) {
    try {
      // Call /api/auth/status with the authToken cookie
      const res = await fetch(`${request.nextUrl.origin}/api/auth/status`, {
        method: "GET",
        headers: {
          Cookie: `authToken=${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        isAuthenticated = data.isAuthenticated
        userRole = data.user?.role
        if (data.user && data.user.role === "admin") {
          isAdmin = true
        }
      } else {
        console.warn("Auth status check failed:", res.status, await res.text())
        response = NextResponse.next()
        response.cookies.set("authToken", "", { expires: new Date(0), path: "/" })
        return response
      }
    } catch (error) {
      console.error("Error checking auth status in middleware:", error)
      response = NextResponse.next()
      response.cookies.set("authToken", "", { expires: new Date(0), path: "/" })
      return response
    }
  }

  // Case 1: User tries to access auth-protected routes without being logged in
  if (
    authProtectedRoutes.some((route) => pathname.startsWith(route)) &&
    !isAuthenticated
  ) {
    return redirectToSignIn(request);
  }

  // Case 3: Admin routes require admin role
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return redirectToSignIn(request)
    }
    if (!isAdmin) {
      return redirectToHome(request)
    }
  }

  // Case 4: Authenticated users shouldn't access signin/signup
  if (nonAuthRoutes.some((route) => pathname === route) && isAuthenticated) {
    return redirectToHome(request)
  }

  response = NextResponse.next()
  if (isAuthenticated && userRole) {
    response.headers.set("x-user-role", userRole)
    response.headers.set("x-authenticated", "true")
  } else {
    response.headers.set("x-authenticated", "false")
  }

  return response
}

// Helper function to redirect to sign in page
function redirectToSignIn(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.searchParams.set("callbackUrl", request.nextUrl.pathname)
  url.pathname = "/signin"
  return NextResponse.redirect(url)
}

// Helper function to redirect to home page
function redirectToHome(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/"
  return NextResponse.redirect(url)
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
}
