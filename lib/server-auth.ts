import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { authTokens, users } from "@/db/schema";
import { verifyToken } from "@/utils/jwt";

export interface AuthUser {
  userId: string;
  role: string;
}

// Resolve the logged-in user from the authToken cookie.
// Mirrors /api/auth/status: valid JWT + live row in auth_tokens (so sign-out revokes it).
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = request.headers.get("cookie")?.match(/authToken=([^;]+)/)?.[1];
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.userId) return null;

  // One round trip: live token row + current role from users
  const [record] = await db
    .select({ role: users.role })
    .from(authTokens)
    .innerJoin(users, eq(users.id, authTokens.userId))
    .where(
      and(
        eq(authTokens.token, token),
        eq(authTokens.userId, payload.userId),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!record) return null;

  // Role comes from the DB, not the JWT, so demotions apply immediately
  return { userId: payload.userId, role: record.role };
}

// Require a logged-in user. When `claimedUserId` is given (legacy query/body
// param), it must match the session user.
export async function requireUser(
  request: Request,
  claimedUserId?: string | null,
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: NextResponse }> {
  const user = await getAuthUser(request);

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (claimedUserId && claimedUserId !== user.userId) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user };
}

// Require an admin. getAuthUser reads the role from the DB, so a demoted admin
// loses access immediately rather than when their JWT expires.
export async function requireAdmin(
  request: Request,
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: NextResponse }> {
  const auth = await requireUser(request);
  if (auth.error) return auth;

  if (auth.user.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return auth;
}

// Allow the resource owner or an admin (e.g. order details, user profile).
export async function requireOwnerOrAdmin(
  request: Request,
  ownerId: string | null | undefined,
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: NextResponse }> {
  const auth = await requireUser(request);
  if (auth.error) return auth;
  if (ownerId && ownerId === auth.user.userId) return auth;
  if (auth.user.role === "admin") return auth;
  return {
    error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}
