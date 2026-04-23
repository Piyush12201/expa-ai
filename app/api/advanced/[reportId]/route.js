import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/auth.js";
import prisma from "../../../../lib/db.js";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reportId } = params;

    const report = await prisma.report.findFirst({
      where: { id: reportId, userId: user.id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const [actions, financials, positioning, swot, checklist, businessPlan] = 
      await Promise.all([
        prisma.actionItem.findMany({
          where: { reportId },
          orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
        }),
        prisma.financialProjection.findUnique({ where: { reportId } }),
        prisma.positioningMap.findUnique({ where: { reportId } }),
        prisma.sWOTAnalysis.findUnique({ where: { reportId } }),
        prisma.investorChecklist.findUnique({ where: { reportId } }),
        prisma.businessPlan.findUnique({ where: { reportId } }),
      ]);

    const parsed = {
      actions: actions || [],
      financials: financials ? {
        ...financials,
        monthlyProjections: JSON.parse(financials.monthlyProjections || "[]"),
        assumptions: JSON.parse(financials.assumptions || "[]"),
        keyDrivers: JSON.parse(financials.keyDrivers || "[]"),
      } : null,
      positioning: positioning ? {
        ...positioning,
        competitors: JSON.parse(positioning.competitors || "[]"),
        positioning: JSON.parse(positioning.positioning || "{}"),
      } : null,
      swot: swot ? {
        strengths: JSON.parse(swot.strengths || "[]"),
        weaknesses: JSON.parse(swot.weaknesses || "[]"),
        opportunities: JSON.parse(swot.opportunities || "[]"),
        threats: JSON.parse(swot.threats || "[]"),
      } : null,
      checklist: checklist ? {
        ...checklist,
        items: JSON.parse(checklist.checklistJson || "[]"),
      } : null,
      businessPlan: businessPlan ? {
        id: businessPlan.id,
        title: businessPlan.title,
        executiveSummary: businessPlan.executiveSummary,
        sections: JSON.parse(businessPlan.content || "{}"),
      } : null,
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error fetching advanced analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch advanced analysis" },
      { status: 500 }
    );
  }
}
