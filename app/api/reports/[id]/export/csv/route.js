import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../../../lib/auth.js";
import { getReportForUser } from "../../../../../../lib/report-service.js";

export const runtime = "nodejs";

function toCsv(report) {
  const result = JSON.parse(report.resultJson);
  const rows = [
    ["Report ID", report.id],
    ["Idea", report.idea],
    ["Location", report.location],
    ["Created At", report.createdAt.toISOString()],
    ["Headline", result.headline || ""],
    ["Market Scope", result.market_scope || ""],
    ["Target Customers", result.target_customers || ""],
    ["Investment Estimate", result.investment_estimate || ""],
    ["Legal Requirements", result.legal_requirements || ""],
    ["Legal Formalities Checklist", Array.isArray(result.legal_formalities_checklist) ? result.legal_formalities_checklist.join(" | ") : (result.legal_formalities_checklist || "")],
    ["Competition", result.competition || ""],
    ["Risks", result.risks || ""],
    ["Opportunities", result.opportunities || ""],
    ["Recommended Next Step", result.recommended_next_step || ""],
    ["Key Questions", result.key_questions || ""],
    ["Market Score", result.market_score || ""],
    ["Risk Score", result.risk_score || ""],
    ["Capital Intensity", result.capital_intensity || ""],
    ["Launch Speed", result.launch_speed || ""],
    ["Viability Index", result.viability_index || ""],
    ["Confidence Score", result.confidence_score || ""],
    ["Confidence Note", result.confidence_note || ""],
  ];

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export async function GET(request, { params }) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await getReportForUser({ userId: user.id, reportId: params.id });

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const csv = toCsv(report);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${report.id}.csv"`,
    },
  });
}
