import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../../lib/auth.js";
import prisma from "../../../../../lib/db.js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reportId } = params;
    const format = new URL(request.url).searchParams.get("format") || "text";

    const report = await prisma.report.findFirst({
      where: { id: reportId, userId: user.id },
    });

    const businessPlan = await prisma.businessPlan.findUnique({
      where: { reportId },
    });

    if (!report || !businessPlan) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (format === "pdf") {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Letter size
      const { height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let yPos = height - 50;
      const lineHeight = 14;
      const margin = 50;

      const drawText = (text, size, isBold = false) => {
        const f = isBold ? boldFont : font;
        const lines = text.match(/.{1,80}/g) || [];
        lines.forEach((line) => {
          if (yPos < margin) {
            yPos = height - margin;
            page.drawText(line, {
              x: margin,
              y: yPos,
              size,
              font: f,
              color: rgb(0, 0, 0),
            });
          } else {
            page.drawText(line, {
              x: margin,
              y: yPos,
              size,
              font: f,
              color: rgb(0, 0, 0),
            });
          }
          yPos -= lineHeight;
        });
      };

      drawText(businessPlan.title, 24, true);
      yPos -= 10;
      drawText(businessPlan.executiveSummary, 11);

      const pdfBytes = await pdfDoc.save();
      return new NextResponse(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="business-plan-${reportId}.pdf"`,
        },
      });
    } else {
      // Return as text
      const text = `
${businessPlan.title}

EXECUTIVE SUMMARY
${businessPlan.executiveSummary}

COMPANY DESCRIPTION
${businessPlan.section1_Executive}

MARKET ANALYSIS
${businessPlan.section2_Market}

COMPETITIVE LANDSCAPE & STRATEGY
${businessPlan.section3_Strategy}

FINANCIAL PROJECTIONS & OPERATIONS
${businessPlan.section4_Financial}

IMPLEMENTATION ROADMAP
${businessPlan.section5_Implementation}
`;

      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="business-plan-${reportId}.txt"`,
        },
      });
    }
  } catch (error) {
    console.error("Error generating business plan:", error);
    return NextResponse.json(
      { error: "Failed to generate business plan" },
      { status: 500 }
    );
  }
}
