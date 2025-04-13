import jwt from "jsonwebtoken";

export function generateToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: "12h" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: string;
    role: string;
  };
}