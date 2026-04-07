import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import { getAuthenticatedUser } from "../../../../../../lib/auth.js";
import { getReportForUser } from "../../../../../../lib/report-service.js";
import path from "path";

export const runtime = "nodejs";

function normalizePdfText(value) {
  return String(value || "-")
    .replaceAll("₹", "INR ")
    .replaceAll("€", "EUR ")
    .replaceAll("£", "GBP ")
    .replaceAll("¥", "JPY ")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("’", "'")
    .replaceAll("•", "-")
    .replaceAll(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function wrapText(text, maxChars) {
  const source = normalizePdfText(text);
  const words = source.split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (candidate.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

async function buildPdfBuffer(report) {
  const result = JSON.parse(report.resultJson);
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoPath = path.join(process.cwd(), "public", "pravideon-logo.png");
  const logoBytes = fs.readFileSync(logoPath);
  const logoImage = await pdf.embedPng(logoBytes);

  let page = pdf.addPage([595, 842]);
  const margin = 50;
  const width = page.getWidth();
  const height = page.getHeight();
  let y = height - margin;

  const drawBrandLogo = (x, yTop, size) => {
    const yBase = yTop - size;
    page.drawImage(logoImage, {
      x,
      y: yBase,
      width: size,
      height: size,
    });
  };

  const drawSectionTitle = (title) => {
    if (y < margin + 60) {
      page = pdf.addPage([595, 842]);
      y = page.getHeight() - margin;
    }

    page.drawRectangle({
      x: margin,
      y: y - 24,
      width: width - margin * 2,
      height: 22,
      color: rgb(0.92, 0.96, 1),
      borderRadius: 5,
    });
    page.drawText(title, {
      x: margin + 10,
      y: y - 18,
      font: bold,
      size: 10,
      color: rgb(0.09, 0.26, 0.49),
    });

    y -= 32;
  };

  const drawLine = (text, options = {}) => {
    const {
      font = regular,
      size = 11,
      color = rgb(0.1, 0.1, 0.1),
      maxChars = 92,
      gap = 5,
    } = options;

    const lines = wrapText(text, maxChars);

    for (const line of lines) {
      if (y < margin + 30) {
        page = pdf.addPage([595, 842]);
        y = page.getHeight() - margin;
      }

      page.drawText(line, {
        x: margin,
        y,
        font,
        size,
        color,
        maxWidth: width - margin * 2,
      });

      y -= size + gap;
    }
  };

  page.drawRectangle({
    x: margin,
    y: y - 72,
    width: width - margin * 2,
    height: 72,
    color: rgb(0.1, 0.16, 0.31),
    borderRadius: 10,
  });
  drawBrandLogo(margin + 12, y - 10, 48);
  page.drawText("Expa AI", {
    x: margin + 74,
    y: y - 25,
    font: bold,
    size: 16,
    color: rgb(0.92, 0.96, 1),
  });
  page.drawText("Business Intelligence Report", {
    x: margin + 74,
    y: y - 44,
    font: regular,
    size: 11,
    color: rgb(0.75, 0.84, 0.98),
  });
  page.drawText(new Date(report.createdAt).toISOString().slice(0, 10), {
    x: width - margin - 90,
    y: y - 32,
    font: bold,
    size: 10,
    color: rgb(0.85, 0.91, 1),
  });
  page.drawText("Business intelligence report", {
    x: margin + 74,
    y: y - 60,
    font: bold,
    size: 8.5,
    color: rgb(0.92, 0.96, 1),
  });

  y -= 86;
  drawSectionTitle("Report Metadata");
  drawLine(`Report ID: ${report.id}`, { size: 10 });
  drawLine(`Idea: ${report.idea}`, { size: 10 });
  drawLine(`Location: ${report.location}`, { size: 10, gap: 8 });

  drawSectionTitle("Executive Summary");
  drawLine(`Headline: ${result.headline || "-"}`, { size: 11, gap: 6 });
  drawLine(`Market Scope: ${result.market_scope || "-"}`, { size: 11, gap: 6 });
  drawLine(`Target Customers: ${result.target_customers || "-"}`, { size: 11, gap: 6 });
  drawLine(`Investment Estimate: ${result.investment_estimate || "-"}`, { size: 11, gap: 8 });

  drawSectionTitle("Compliance and Legal");
  drawLine(`Legal Requirements: ${result.legal_requirements || "-"}`, { size: 11, gap: 6 });
  const checklist = Array.isArray(result.legal_formalities_checklist)
    ? result.legal_formalities_checklist
    : [result.legal_formalities_checklist];
  for (const item of checklist.filter(Boolean)) {
    drawLine(`- ${item}`, { size: 10, maxChars: 95, gap: 4 });
  }
  y -= 4;

  drawSectionTitle("Risk and Opportunity");
  drawLine(`Competition: ${result.competition || "-"}`, { size: 11, gap: 6 });
  drawLine(`Risks: ${result.risks || "-"}`, { size: 11, gap: 6 });
  drawLine(`Opportunities: ${result.opportunities || "-"}`, { size: 11, gap: 8 });

  drawSectionTitle("Scores and Recommendations");
  drawLine(`Market Score: ${result.market_score || "-"}/10`, { size: 11, gap: 5 });
  drawLine(`Risk Score: ${result.risk_score || "-"}/10`, { size: 11, gap: 5 });
  drawLine(`Capital Intensity: ${result.capital_intensity || "-"}/10`, { size: 11, gap: 5 });
  drawLine(`Launch Speed: ${result.launch_speed || "-"}/10`, { size: 11, gap: 5 });
  drawLine(`Viability Index: ${result.viability_index || "-"}/10`, { size: 11, gap: 5 });
  drawLine(`Confidence Score: ${result.confidence_score || "-"}/10`, { size: 11, gap: 6 });
  drawLine(`Confidence Note: ${result.confidence_note || "-"}`, { size: 10, gap: 6 });
  drawLine(`Recommended Next Step: ${result.recommended_next_step || "-"}`, { size: 10, gap: 6 });
  drawLine(`Key Questions: ${result.key_questions || "-"}`, { size: 10, gap: 6 });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
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

  const pdfBuffer = await buildPdfBuffer(report);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${report.id}.pdf"`,
    },
  });
}
