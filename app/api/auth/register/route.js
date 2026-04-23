import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db.js";
import {
  getAuthCookieConfig,
  getAuthCookieName,
  hashPassword,
  signAuthToken,
  validateCredentials,
} from "../../../../lib/auth.js";
import { ensureDefaultWorkspace } from "../../../../lib/workspace-service.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { cleanName, cleanEmail, cleanPassword } = validateCredentials(body);

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: cleanName || cleanEmail.split("@")[0],
        email: cleanEmail,
        passwordHash: await hashPassword(cleanPassword),
      },
      select: { id: true, email: true, name: true },
    });

    await ensureDefaultWorkspace(user.id);

    const token = await signAuthToken(user);
    const response = NextResponse.json({ success: true, user });
    response.cookies.set(getAuthCookieName(), token, getAuthCookieConfig());
    return response;
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status: statusCode });
  }
}
