import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../lib/auth.js";
import { createWorkspace, getUserWorkspaces } from "../../../lib/workspace-service.js";

export const runtime = "nodejs";

export async function GET(request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await getUserWorkspaces(user.id);
  return NextResponse.json({ success: true, items: workspaces });
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const workspace = await createWorkspace(user.id, body.name);
    return NextResponse.json({ success: true, workspace });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json({ error: error.message }, { status: statusCode });
  }
}
