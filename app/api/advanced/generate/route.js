import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/auth.js";
import { resolveWorkspace } from "../../../../lib/workspace-service.js";
import prisma from "../../../../lib/db.js";
import {
  generateFinancialProjections,
  generateActionItems,
  generateSWOTandPositioning,
  generateInvestorChecklist,
  generateBusinessPlan,
} from "../../../../lib/advanced-analysis.js";

export const runtime = "nodejs";

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { reportId } = body;

    const report = await prisma.report.findFirst({
      where: { id: reportId, userId: user.id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const result = JSON.parse(report.resultJson);
    const metrics = {
      setupCost: result.setup_cost,
      monthlyOps: result.monthly_operating_cost,
      unitPrice: result.unit_price,
    };

    // Generate all advanced analyses sequentially (to avoid Groq rate limits)
    const financials = await generateFinancialProjections(report.idea, report.location, metrics);
    const financialsForDb = { ...financials };
    delete financialsForDb.assumptions;
    delete financialsForDb.keyDrivers;
    const actionItems = await generateActionItems(report.idea, report.location, result);
    const swotPos = await generateSWOTandPositioning(report.idea, report.location, result);
    const investorList = await generateInvestorChecklist(report.idea, result);
    const businessPlan = await generateBusinessPlan(report.idea, report.location, result, metrics);

    // Save to database
    const [financial, actions, positioning, checklist] = await Promise.all([
      prisma.financialProjection.upsert({
        where: { reportId },
        create: {
          reportId,
          ...financialsForDb,
          monthlyProjections: JSON.stringify(financialsForDb.monthlyProjections),
        },
        update: {
          ...financialsForDb,
          monthlyProjections: JSON.stringify(financialsForDb.monthlyProjections),
        },
      }),
      prisma.sWOTAnalysis.upsert({
        where: { reportId },
        create: {
          reportId,
          strengths: JSON.stringify(swotPos.swot.strengths),
          weaknesses: JSON.stringify(swotPos.swot.weaknesses),
          opportunities: JSON.stringify(swotPos.swot.opportunities),
          threats: JSON.stringify(swotPos.swot.threats),
        },
        update: {
          strengths: JSON.stringify(swotPos.swot.strengths),
          weaknesses: JSON.stringify(swotPos.swot.weaknesses),
          opportunities: JSON.stringify(swotPos.swot.opportunities),
          threats: JSON.stringify(swotPos.swot.threats),
        },
      }),
      prisma.positioningMap.upsert({
        where: { reportId },
        create: {
          reportId,
          marketMaturity: swotPos.positioning.marketMaturity,
          differentiation: swotPos.positioning.differentiation,
          quadrant: swotPos.positioning.quadrant,
          competitors: JSON.stringify(swotPos.competitors),
          positioning: JSON.stringify(swotPos.positioning),
        },
        update: {
          marketMaturity: swotPos.positioning.marketMaturity,
          differentiation: swotPos.positioning.differentiation,
          quadrant: swotPos.positioning.quadrant,
          competitors: JSON.stringify(swotPos.competitors),
          positioning: JSON.stringify(swotPos.positioning),
        },
      }),
      prisma.investorChecklist.upsert({
        where: { reportId },
        create: {
          reportId,
          checklistJson: JSON.stringify(investorList.checklist),
          overallReadinessPercent: investorList.overallReadinessPercent,
        },
        update: {
          checklistJson: JSON.stringify(investorList.checklist),
          overallReadinessPercent: investorList.overallReadinessPercent,
        },
      }),
    ]);

    // Create action items
    await prisma.actionItem.deleteMany({ where: { reportId } });
    const createdActions = await Promise.all(
      actionItems.map((item) =>
        prisma.actionItem.create({
          data: {
            reportId,
            title: item.title,
            description: item.description,
            priority: item.priority,
            dueDate: item.dueDate,
          },
        })
      )
    );

    // Create business plan
    await prisma.businessPlan.deleteMany({ where: { reportId } });
    const plan = await prisma.businessPlan.create({
      data: {
        reportId,
        title: businessPlan.title,
        executiveSummary: businessPlan.sections.executiveSummary,
        section1_Executive: businessPlan.sections.executiveSummary,
        section2_Market: businessPlan.sections.marketAnalysis,
        section3_Strategy: businessPlan.sections.marketingStrategy,
        section4_Financial: businessPlan.sections.financialProjections,
        section5_Implementation: businessPlan.sections.implementationTimeline,
        content: JSON.stringify(businessPlan.sections),
      },
    });

    return NextResponse.json({
      success: true,
      financials: {
        year1: `$${financial.year1Revenue.toLocaleString()} revenue, $${financial.year1Costs.toLocaleString()} costs`,
        year5: `$${financial.year5Revenue.toLocaleString()} revenue, $${financial.year5Costs.toLocaleString()} costs`,
        breakevenMonth: financial.breakevenMonth,
        impliedValuation: `$${financial.impliedValuation.toLocaleString()}`,
      },
      positioning: {
        maturity: positioning.marketMaturity,
        differentiation: positioning.differentiation,
        quadrant: positioning.quadrant,
      },
      swot: swotPos.swot,
      actionItems: createdActions.length,
      checklist: investorList,
      businessPlan: {
        id: plan.id,
        title: plan.title,
      },
    });
  } catch (error) {
    console.error("Advanced analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate advanced analysis" },
      { status: 500 }
    );
  }
}
