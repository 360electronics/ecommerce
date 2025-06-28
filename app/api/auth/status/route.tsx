import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { authTokens, users } from "@/db/schema";
import { verifyToken } from "@/utils/jwt";
import { eq, and } from "drizzle-orm";

// Define the response type
interface AuthStatusResponse {
  isAuthenticated: boolean;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    role: "user" | "admin" | "guest";
    emailVerified: boolean;
    phoneVerified: boolean;
  } | null;
  error?: string;
}

// GET /api/auth/status
export async function GET(request: Request) {
  let token: string | undefined;

  try {
    // Extract token from cookie or Authorization header
    const cookies = request.headers.get("cookie");
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    }

    if (!token && cookies) {
      const cookieMatch = cookies.match(/authToken=([^;]+)/);
      token = cookieMatch ? cookieMatch[1] : undefined;
    }

    if (!token) {
      return NextResponse.json<AuthStatusResponse>(
        { isAuthenticated: false, user: null, error: "No token provided" },
        { status: 401 }
      );
    }

    // Verify JWT
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json<AuthStatusResponse>(
        { isAuthenticated: false, user: null, error: "Invalid or expired JWT" },
        { status: 401 }
      );
    }

    // Query auth_tokens table for token
    const tokenRecord = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.token, token),
          eq(authTokens.userId, payload.userId)
        )
      )
      .limit(1);

    if (!tokenRecord.length) {
      return NextResponse.json<AuthStatusResponse>(
        { isAuthenticated: false, user: null, error: "Invalid token" },
        { status: 401 }
      );
    }

    const record = tokenRecord[0];
    if (!record.expiresAt || record.expiresAt < new Date()) {
      return NextResponse.json<AuthStatusResponse>(
        { isAuthenticated: false, user: null, error: "Token expired" },
        { status: 401 }
      );
    }

    // Fetch user details
    const userId = record.userId;
    const userRecord = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        emailVerified: users.emailVerified,
        phoneVerified: users.phoneVerified,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRecord.length) {
      return NextResponse.json<AuthStatusResponse>(
        { isAuthenticated: false, user: null, error: "User not found" },
        { status: 401 }
      );
    }

    const user = userRecord[0];

    // Validate user data: require role and at least one verified contact method
    if (
      user.role === null ||
      (user.email === null && user.phoneNumber === null) || // Must have at least email or phone
      (user.email !== null && user.emailVerified === null) || // Email must have verification status
      (user.phoneNumber !== null && user.phoneVerified === null) // Phone must have verification status
    ) {
      console.error("Invalid user data:", {
        userId,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      });
      return NextResponse.json<AuthStatusResponse>(
        { isAuthenticated: false, user: null, error: "Invalid user data" },
        { status: 401 }
      );
    }

    // Ensure guest users are marked as verified for their login method
    if (user.role === "guest") {
      if (
        (user.email !== null && !user.emailVerified) ||
        (user.phoneNumber !== null && !user.phoneVerified)
      ) {
        console.error("Guest user not verified:", {
          userId,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        });
        return NextResponse.json<AuthStatusResponse>(
          { isAuthenticated: false, user: null, error: "User not verified" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json<AuthStatusResponse>({
      isAuthenticated: true,
      user: {
        id: user.id,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phoneNumber: user.phoneNumber ?? "",
        role: user.role ?? "guest",
        emailVerified: user.emailVerified ?? false,
        phoneVerified: user.phoneVerified ?? false,
      },
    });
  } catch (error) {
    console.error("Error checking auth status:", {
      error: error instanceof Error ? error.message : "Unknown error",
      token: token ? "present" : "missing",
    });
    return NextResponse.json<AuthStatusResponse>(
      { isAuthenticated: false, user: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}