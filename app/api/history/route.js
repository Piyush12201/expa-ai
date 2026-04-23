import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../lib/auth.js";
import {
  deleteReportsForUserWorkspace,
  getReportsByWorkspace,
  mapReport,
} from "../../../lib/report-service.js";

export const runtime = "nodejs";

export async function GET(request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = new URL(request.url).searchParams.get("workspaceId") || undefined;
  const rows = await getReportsByWorkspace({ userId: user.id, workspaceId });
  const items = rows.map(mapReport);
  return NextResponse.json({ success: true, items });
}

export async function DELETE(request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = new URL(request.url).searchParams.get("workspaceId") || undefined;
  await deleteReportsForUserWorkspace({ userId: user.id, workspaceId });
  return NextResponse.json({ success: true });
}
