import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/auth.js";
import { getUserWorkspaces } from "../../../../lib/workspace-service.js";

export const runtime = "nodejs";

export async function GET(request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null, workspaces: [] });
  }

  const workspaces = await getUserWorkspaces(user.id);

  return NextResponse.json({
    authenticated: true,
    user,
    workspaces,
  });
}
