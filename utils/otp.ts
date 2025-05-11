import { db } from "@/db/drizzle";
import { otpTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export function generateOTP(length = 6): string {
  return Math.floor(100000 + Math.random() * 900000)
    .toString()
    .slice(0, length);
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
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

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
