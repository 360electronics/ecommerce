import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const authProtectedRoutes = ["/profile", "/cart", "/checkout", "/wishlist"]
const adminRoutes = ["/admin"]
const nonAuthRoutes = ["/signin", "/signup"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get("authToken")?.value
  let isAuthenticated = false
  let isAdmin = false
  let userRole: string | null = null

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
      const { payload } = await jwtVerify(token, secret)
      isAuthenticated = true
      userRole = (payload.role as string) ?? null
      isAdmin = userRole === "admin"
    } catch {
      // Token invalid or expired — treat as unauthenticated
      const response = NextResponse.next()
      response.cookies.set("authToken", "", { expires: new Date(0), path: "/" })
      // Still fall through to route protection below with isAuthenticated = false
    }
  }

  // Auth-protected routes require login
  if (
    authProtectedRoutes.some((route) => pathname.startsWith(route)) &&
    !isAuthenticated
  ) {
    return redirectToSignIn(request)
  }

  // Admin routes require admin role
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return redirectToSignIn(request)
    }
    if (!isAdmin) {
      return redirectToHome(request)
    }
  }

  // Authenticated users shouldn't access signin/signup
  if (nonAuthRoutes.some((route) => pathname === route) && isAuthenticated) {
    return redirectToHome(request)
  }

  const response = NextResponse.next()
  if (isAuthenticated && userRole) {
    response.headers.set("x-user-role", userRole)
    response.headers.set("x-authenticated", "true")
  } else {
    response.headers.set("x-authenticated", "false")
  }

  return response
}

function redirectToSignIn(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.searchParams.set("callbackUrl", request.nextUrl.pathname)
  url.pathname = "/signin"
  return NextResponse.redirect(url)
}

function redirectToHome(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/"
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
