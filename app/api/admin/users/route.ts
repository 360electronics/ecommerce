import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/server-auth";

// Sign-in matches the identifier exactly as typed, so store the forms people
// actually type: lowercase email, bare 10-digit Indian mobile number.
const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
};

const createAdminSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(255),
  lastName: z.string().trim().max(255).optional().default(""),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(255),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? normalizePhone(v) : ""))
    .refine((v) => v === "" || /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number"),
});

/*
 * POST /api/admin/users — create a new admin account.
 * The new admin signs in with the normal OTP flow using this email/phone;
 * their email/phone gets verified on first login.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  try {
    const parsed = createAdminSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Invalid details", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { firstName, lastName, email, phoneNumber } = parsed.data;

    // Email / phone are unique across all accounts (customers included)
    const conflicts = await db
      .select({ id: users.id, email: users.email, phoneNumber: users.phoneNumber, role: users.role })
      .from(users)
      .where(
        phoneNumber
          ? or(eq(users.email, email), eq(users.phoneNumber, phoneNumber))
          : eq(users.email, email),
      )
      .limit(2);

    if (conflicts.length > 0) {
      const byEmail = conflicts.find((c) => c.email === email);
      const field = byEmail ? "email" : "phone number";
      const existing = byEmail ?? conflicts[0];
      return NextResponse.json(
        {
          error:
            existing.role === "admin"
              ? `An admin with this ${field} already exists`
              : `A customer account already uses this ${field}`,
        },
        { status: 409 },
      );
    }

    const [created] = await db
      .insert(users)
      .values({
        firstName,
        lastName: lastName || null,
        email,
        phoneNumber: phoneNumber || null,
        role: "admin",
        emailVerified: false,
        phoneVerified: false,
      })
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        createdAt: users.createdAt,
      });

    console.info("[ADMIN_USER_CREATED]", { id: created.id, by: admin.user.userId });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    // Unique violation from a concurrent create with the same email/phone
    const code = (error as { code?: string; cause?: { code?: string } })?.code
      ?? (error as { cause?: { code?: string } })?.cause?.code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "An account with this email or phone number already exists" },
        { status: 409 },
      );
    }
    console.error("[ADMIN_USER_CREATE_ERROR]", error);
    return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 });
  }
}
