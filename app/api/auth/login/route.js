import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db.js";
import {
  comparePassword,
  getAuthCookieConfig,
  getAuthCookieName,
  signAuthToken,
  validateCredentials,
} from "../../../../lib/auth.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { cleanEmail, cleanPassword } = validateCredentials({
      email: body.email,
      password: body.password,
      name: "ok",
    });

    const userRecord = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!userRecord) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await comparePassword(cleanPassword, userRecord.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const safeUser = { id: userRecord.id, email: userRecord.email, name: userRecord.name };
    const token = await signAuthToken(safeUser);

    const response = NextResponse.json({ success: true, user: safeUser });
    response.cookies.set(getAuthCookieName(), token, getAuthCookieConfig());
    return response;
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status: statusCode });
  }
}
