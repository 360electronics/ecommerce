import jwt from "jsonwebtoken";

export function generateToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: "12h" });
}

export function generateRefreshToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string; exp: number };
    return decoded;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}
