import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../../lib/auth.js";
import { createOrGetShareToken, getReportForUser } from "../../../../../lib/report-service.js";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await getReportForUser({ userId: user.id, reportId: params.id });

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const token = await createOrGetShareToken(report.id);
  const shareUrl = `${request.nextUrl.origin}/share/${token}`;

  return NextResponse.json({ success: true, token, shareUrl });
}
