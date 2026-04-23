import Groq from "groq-sdk";

function parseJsonFromText(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) {
    throw new Error("No JSON found in model response");
  }

  const candidate = match[0];

  try {
    return JSON.parse(candidate);
  } catch {
    // Repair common LLM issues like bare words: "estimatedDays": Ongoing
    const repaired = candidate
      .replace(/:\s*([A-Za-z][A-Za-z\s_-]*)(\s*[,}\]])/g, (full, rawValue, suffix) => {
        const value = String(rawValue || "").trim();
        if (/^(true|false|null)$/i.test(value)) return `: ${value.toLowerCase()}${suffix}`;
        if (/^-?\d+(\.\d+)?$/.test(value)) return `: ${value}${suffix}`;
        return `: "${value.replace(/"/g, "\\\"")}"${suffix}`;
      })
      .replace(/,\s*([}\]])/g, "$1");

    return JSON.parse(repaired);
  }
}

function sanitizeText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function estimatedDaysToNumber(value, fallback = 14) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.min(180, Math.round(value));
  }

  const text = String(value || "").toLowerCase().trim();
  const extracted = text.match(/\d+/)?.[0];
  if (extracted) {
    const n = Number.parseInt(extracted, 10);
    return Math.min(180, Math.max(1, n));
  }

  if (text.includes("ongoing") || text.includes("continuous")) return 30;
  if (text.includes("week")) return 14;
  if (text.includes("month")) return 30;

  return fallback;
}

async function callAdvancedModel(prompt, temperature = 0.3) {
  if (process.env.OPENROUTER_API_KEY) {
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing AI provider key. Set OPENROUTER_API_KEY or GROQ_API_KEY.");
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature,
  });

  return completion.choices?.[0]?.message?.content || "";
}

export async function generateFinancialProjections(idea, location, baseMetrics) {
  const prompt = `
Business: ${idea} in ${location}
Current Setup Cost Estimate: $${baseMetrics.setupCost}
Current Monthly Operating Cost: $${baseMetrics.monthlyOps}
Current Unit Price: $${baseMetrics.unitPrice}

Generate a detailed 5-year financial projection. Return ONLY JSON.

{
  "year1": { "revenue": 50000, "costs": 80000, "monthlyBreakdown": [{"month": "Jan", "revenue": 0, "costs": 10000}] },
  "year2": { "revenue": 180000, "costs": 120000 },
  "year3": { "revenue": 450000, "costs": 180000 },
  "year4": { "revenue": 850000, "costs": 280000 },
  "year5": { "revenue": 1500000, "costs": 400000 },
  "assumptions": ["Growth drivers and key assumptions"],
  "breakevenMonth": 14,
  "impliedValuation": 5000000,
  "keyDrivers": ["Revenue driver 1", "Cost lever 1", "Unit economics insight"]
}
`;

  const content = await callAdvancedModel(prompt, 0.3);
  const raw = parseJsonFromText(content);
  
  return {
    year1Revenue: raw.year1.revenue,
    year1Costs: raw.year1.costs,
    year2Revenue: raw.year2.revenue,
    year2Costs: raw.year2.costs,
    year3Revenue: raw.year3.revenue,
    year3Costs: raw.year3.costs,
    year4Revenue: raw.year4.revenue,
    year4Costs: raw.year4.costs,
    year5Revenue: raw.year5.revenue,
    year5Costs: raw.year5.costs,
    breakevenMonth: raw.breakevenMonth,
    impliedValuation: raw.impliedValuation,
    roisPercentage: Math.round((raw.year5.revenue - raw.year1.costs) / raw.year1.costs * 100),
    monthlyProjections: raw.year1.monthlyBreakdown,
    assumptions: raw.assumptions,
    keyDrivers: raw.keyDrivers,
  };
}

export async function generateActionItems(idea, location, analysis) {
  const prompt = `
Business Idea: ${idea} in ${location}
Market Score: ${analysis.market_score}
Risk: ${analysis.risks}

Generate 10-15 specific, actionable next steps with priorities and timelines.
Return ONLY JSON array.

[
  {
    "title": "Action item title",
    "description": "1-2 sentence description of what to do",
    "priority": "high|medium|low",
    "estimatedDays": 7,
    "category": "validation|legal|marketing|product|fundraising",
    "successCriteria": "How to know this is done"
  }
]
`;

  const content = await callAdvancedModel(prompt, 0.3);
  const raw = parseJsonFromText(content);
  
  return raw.map((item, idx) => ({
    title: item.title,
    description: item.description,
    priority: item.priority || "medium",
    dueDate: new Date(Date.now() + estimatedDaysToNumber(item.estimatedDays) * 24 * 60 * 60 * 1000),
    category: item.category,
    successCriteria: item.successCriteria,
    order: idx,
  }));
}

export async function generateSWOTandPositioning(idea, location, analysis) {
  const prompt = `
Business: ${idea} in ${location}
Competition: ${analysis.competition}
Market Score: ${analysis.market_score}

Generate detailed SWOT analysis and market positioning. Return ONLY JSON.

{
  "strengths": ["Unique strength 1", "Strength 2"],
  "weaknesses": ["Challenge 1", "Weakness 2"],
  "opportunities": ["Market opportunity 1", "Growth channel"],
  "threats": ["Competitive threat", "Market threat"],
  "positioning": {
    "marketMaturity": 6,
    "differentiation": 7,
    "quadrant": "innovator",
    "positioningStatement": "Your unique market position"
  },
  "competitors": [
    {"name": "Competitor name", "maturity": 8, "differentiation": 5}
  ]
}
`;

  const content = await callAdvancedModel(prompt, 0.3);
  const raw = parseJsonFromText(content);
  
  const quadrants = {
    established: "You operate in a mature market with limited differentiation",
    innovator: "You bring new solutions to an existing market",
    niche: "You dominate a specific underserved segment",
    disruption: "You fundamentally change how customers solve this problem",
  };

  return {
    swot: {
      strengths: raw.strengths || [],
      weaknesses: raw.weaknesses || [],
      opportunities: raw.opportunities || [],
      threats: raw.threats || [],
    },
    positioning: {
      marketMaturity: raw.positioning.marketMaturity,
      differentiation: raw.positioning.differentiation,
      quadrant: raw.positioning.quadrant,
      description: quadrants[raw.positioning.quadrant] || "",
      statement: raw.positioning.positioningStatement,
    },
    competitors: raw.competitors || [],
  };
}

export async function generateInvestorChecklist(idea, analysis) {
  const prompt = `
Business Idea: ${idea}
Market Score: ${analysis.market_score}
Viability: ${analysis.viability_index}
Confidence: ${analysis.confidence_score}

Generate a comprehensive investor-ready checklist in 6 categories. Return ONLY JSON array.

[
  {
    "category": "Executive Summary",
    "items": [
      {"item": "Clear problem statement defined", "importance": "critical"},
      {"item": "Solution described with differentiation", "importance": "critical"}
    ]
  }
]

Categories: Executive Summary, Market Validation, Financial Model, Operations, Team/Execution, Legal/Compliance
`;

  const content = await callAdvancedModel(prompt, 0.2);
  const raw = parseJsonFromText(content);
  
  const checklist = raw.map((category) => ({
    category: category.category,
    items: (category.items || []).map((item) => ({
      item: item.item,
      importance: item.importance,
      status: "pending",
      completionPercent: 0,
    })),
  }));

  const totalItems = checklist.reduce((sum, cat) => sum + cat.items.length, 0);
  const overallPercent = Math.round((analysis.confidence_score / 10) * 60); // Base on confidence

  return {
    checklist,
    overallReadinessPercent: overallPercent,
    nextCriticalItem: checklist[0]?.items[0]?.item || "Define clear problem statement",
  };
}

export async function generateBusinessPlan(idea, location, analysis, financials) {
  const prompt = `
Create a comprehensive business plan outline for: ${idea} in ${location}

Return formatted text sections.

EXECUTIVE_SUMMARY: One compelling paragraph
COMPANY_DESCRIPTION: What your business does
MARKET_ANALYSIS: Target market and size
COMPETITIVE_LANDSCAPE: How you compete
MARKETING_STRATEGY: How to acquire customers
OPERATIONS_PLAN: How you deliver
FINANCIAL_PROJECTIONS: Summary of 5-year outlook
IMPLEMENTATION_TIMELINE: Key milestones
RISK_MITIGATION: How to handle setbacks
`;

  const content = await callAdvancedModel(prompt, 0.3);
  const sections = {
    executiveSummary: (content.match(/EXECUTIVE_SUMMARY:([\s\S]*?)(?=\n\w+:|\Z)/)?.[1] || "").trim(),
    companyDescription: (content.match(/COMPANY_DESCRIPTION:([\s\S]*?)(?=\n\w+:|\Z)/)?.[1] || "").trim(),
    marketAnalysis: (content.match(/MARKET_ANALYSIS:([\s\S]*?)(?=\n\w+:|\Z)/)?.[1] || "").trim(),
    competitiveLandscape: (content.match(/COMPETITIVE_LANDSCAPE:([\s\S]*?)(?=\n\w+:|\Z)/)?.[1] || "").trim(),
    marketingStrategy: (content.match(/MARKETING_STRATEGY:([\s\S]*?)(?=\n\w+:|\Z)/)?.[1] || "").trim(),
    operationsPlan: (content.match(/OPERATIONS_PLAN:([\s\S]*?)(?=\n\w+:|\Z)/)?.[1] || "").trim(),
    financialProjections: (content.match(/FINANCIAL_PROJECTIONS:([\s\S]*?)(?=\n\w+:|\Z)/)?.[1] || "").trim(),
    implementationTimeline: (content.match(/IMPLEMENTATION_TIMELINE:([\s\S]*?)(?=\n\w+:|\Z)/)?.[1] || "").trim(),
  };

  return {
    title: `Business Plan: ${idea}`,
    idea,
    location,
    generatedAt: new Date().toISOString(),
    sections,
  };
}
