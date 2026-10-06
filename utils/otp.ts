import { randomInt, timingSafeEqual } from "crypto";
import { db } from "@/db/drizzle";
import { otpTokens } from "@/db/schema";
import { and, eq, gt, lt, sql } from "drizzle-orm";

export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cryptographically secure 6-digit code (Math.random is predictable)
export function generateOTP(length = 6): string {
  return randomInt(10 ** (length - 1), 10 ** length).toString();
}

export async function storeOTP({
  userId,
  otp,
  type,
}: {
  userId: string;
  otp: string;
  type: "email" | "phone";
}) {
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.delete(otpTokens).where(
    eq(otpTokens.userId, userId)
  );

  await db.insert(otpTokens).values({
    userId,
    token: otp,
    type,
    expiresAt,
  });

  return { success: true, expiresAt };
}

// Seconds the user must wait before another OTP can be sent (0 = allowed).
// Stops SMS/email flooding through signin / resend.
export async function getOtpCooldownSeconds(userId: string): Promise<number> {
  const [recent] = await db
    .select({
      wait: sql<number>`CEIL(EXTRACT(EPOCH FROM (${otpTokens.createdAt} + make_interval(secs => ${OTP_RESEND_COOLDOWN_SECONDS}) - now())))::int`,
    })
    .from(otpTokens)
    .where(
      and(
        eq(otpTokens.userId, userId),
        gt(otpTokens.createdAt, sql`now() - make_interval(secs => ${OTP_RESEND_COOLDOWN_SECONDS})`),
      ),
    )
    .limit(1);

  return recent ? Math.max(1, recent.wait) : 0;
}

export type OtpCheckResult = "valid" | "invalid" | "expired_or_locked";

/**
 * Verify an OTP. Every call atomically consumes one attempt (guarded by
 * attempts < max), so even parallel requests get at most OTP_MAX_ATTEMPTS
 * guesses per issued code. A correct code deletes the token.
 */
export async function verifyOTP(
  userId: string,
  type: "email" | "phone",
  otp: string,
): Promise<OtpCheckResult> {
  const [record] = await db
    .update(otpTokens)
    .set({ attempts: sql`${otpTokens.attempts} + 1` })
    .where(
      and(
        eq(otpTokens.userId, userId),
        eq(otpTokens.type, type),
        lt(otpTokens.attempts, OTP_MAX_ATTEMPTS),
        gt(otpTokens.expiresAt, new Date()),
      ),
    )
    .returning({ id: otpTokens.id, token: otpTokens.token, attempts: otpTokens.attempts });

  if (!record) return "expired_or_locked";

  const expected = Buffer.from(record.token);
  const given = Buffer.from(String(otp));
  const matches = expected.length === given.length && timingSafeEqual(expected, given);

  if (matches) {
    await db.delete(otpTokens).where(eq(otpTokens.id, record.id));
    return "valid";
  }

  // Out of attempts: remove the code so a new one must be requested
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await db.delete(otpTokens).where(eq(otpTokens.id, record.id));
  }
  return "invalid";
}
