import jwt from "jsonwebtoken";

export function generateToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: "12h" });
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string; exp: number };
    if (decoded.exp * 1000 < Date.now()) {
      return null; // Expired token
    }
    return decoded;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null; // Invalid token
  }
}