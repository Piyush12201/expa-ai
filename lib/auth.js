import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "./db.js";

const AUTH_COOKIE = "expa_auth";
const encoder = new TextEncoder();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment configuration.");
  }

  return encoder.encode(secret);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function validateCredentials({ name, email, password }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (cleanName && cleanName.length < 2) {
    throw Object.assign(new Error("Name must be at least 2 characters."), { statusCode: 400 });
  }

  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw Object.assign(new Error("Valid email is required."), { statusCode: 400 });
  }

  if (cleanPassword.length < 8) {
    throw Object.assign(new Error("Password must be at least 8 characters."), { statusCode: 400 });
  }

  return { cleanName, cleanEmail, cleanPassword };
}

export async function signAuthToken(user) {
  return new SignJWT({ sub: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload;
}

export function getAuthCookieConfig() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function getAuthCookieName() {
  return AUTH_COOKIE;
}

export async function getAuthenticatedUser(request) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyAuthToken(token);
    if (!payload?.sub) return null;

    const user = await prisma.user.findUnique({
      where: { id: String(payload.sub) },
      select: { id: true, email: true, name: true },
    });

    return user;
  } catch {
    return null;
  }
}
