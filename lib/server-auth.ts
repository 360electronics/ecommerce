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

  const [record] = await db
    .select({ id: authTokens.id })
    .from(authTokens)
    .where(
      and(
        eq(authTokens.token, token),
        eq(authTokens.userId, payload.userId),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!record) return null;

  return { userId: payload.userId, role: payload.role };
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

// Require an admin. Role is re-read from the DB so a demoted admin loses access
// immediately rather than when their JWT expires.
export async function requireAdmin(
  request: Request,
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: NextResponse }> {
  const auth = await requireUser(request);
  if (auth.error) return auth;

  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, auth.user.userId))
    .limit(1);

  if (row?.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user: { ...auth.user, role: "admin" } };
}

// Allow the resource owner or an admin (e.g. order details, user profile).
export async function requireOwnerOrAdmin(
  request: Request,
  ownerId: string | null | undefined,
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: NextResponse }> {
  const auth = await requireUser(request);
  if (auth.error) return auth;
  if (ownerId && ownerId === auth.user.userId) return auth;
  return requireAdmin(request);
}
