import Groq from "groq-sdk";

function parseJsonFromText(text) {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("No JSON found in model response");
  }

  return JSON.parse(match[0]);
}

function sanitizeText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toScore(value, fallback = 5) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.min(10, parsed));
}

function confidenceBand(score) {
  if (score >= 8) return "High";
  if (score >= 6) return "Medium";
  return "Low";
}

function normalizeChecklist(value, fallbackText) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  const parsed = String(value || "")
    .split(/\n|;|\.|\|/)
    .map((item) => item.trim())
    .filter((item) => item.length > 3)
    .slice(0, 8);

  if (parsed.length) {
    return parsed;
  }

  return [fallbackText];
}

function normalizeAnalysis(raw) {
  const marketScore = toScore(raw.market_score, 5);
  const riskScore = toScore(raw.risk_score, 5);
  const capitalIntensity = toScore(raw.capital_intensity, 5);
  const launchSpeed = toScore(raw.launch_speed, 5);
  const viabilityIndex = Math.round((marketScore + (11 - riskScore) + (11 - capitalIntensity) + launchSpeed) / 4);
  const confidenceScore = Math.round((marketScore + launchSpeed + (11 - riskScore)) / 3);
  
  // Calculate funding readiness: viability + confidence + market + (inverse capital intensity)
  const fundingReadiness = Math.round(
    (viabilityIndex * 0.35 + confidenceScore * 0.30 + marketScore * 0.20 + (11 - capitalIntensity) * 0.15)
  );

  // Parse financial metrics
  const setupCost = toScore(raw.setup_cost, 5) * 50000; // 5 = $250K estimate
  const monthlyOperating = toScore(raw.monthly_operating_cost, 5) * 5000; // 5 = $25K/mo
  const unitPrice = toScore(raw.unit_price, 5) * 100; // 5 = $500
  const breakevenUnits = monthlyOperating > 0 ? Math.ceil(monthlyOperating / unitPrice) : 0;
  const breakevenMonths = Math.max(2, Math.ceil(setupCost / (monthlyOperating * 2)));

  return {
    headline: String(raw.headline ?? "Opportunity snapshot").trim(),
    market_scope: String(raw.market_scope ?? "").trim(),
    target_customers: String(raw.target_customers ?? "").trim(),
    investment_estimate: String(raw.investment_estimate ?? "").trim(),
    legal_requirements: String(raw.legal_requirements ?? "").trim(),
    legal_formalities_checklist: normalizeChecklist(
      raw.legal_formalities_checklist,
      "Identify registrations, licenses, tax setup, and local permits required before launch."
    ),
    competition: String(raw.competition ?? "").trim(),
    main_competitors: parseCompetitors(raw.main_competitors, raw.competition),
    risks: String(raw.risks ?? "").trim(),
    opportunities: String(raw.opportunities ?? "").trim(),
    recommended_next_step: String(raw.recommended_next_step ?? "").trim(),
    key_questions: String(raw.key_questions ?? "").trim(),
    market_score: marketScore,
    risk_score: riskScore,
    capital_intensity: capitalIntensity,
    launch_speed: launchSpeed,
    viability_index: viabilityIndex,
    confidence_score: confidenceScore,
    confidence_note: `${confidenceBand(confidenceScore)} confidence based on consistency across market, risk, and launch signals.`,
    funding_readiness_score: fundingReadiness,
    setup_cost: setupCost,
    monthly_operating_cost: monthlyOperating,
    unit_price: unitPrice,
    breakeven_units: breakevenUnits,
    breakeven_months: breakevenMonths,
    confidence_drivers: normalizeChecklist(raw.confidence_drivers || [], "Market validation confirmed; execution timeline feasible; team capacity adequate"),
    confidence_risks: normalizeChecklist(raw.confidence_risks || [], "First-time founder; unproven business model; competitive market"),
    risk_mitigation_playbook: parsePlaybook(raw.risk_mitigation_playbook),
    market_validation_checklist: parseValidationChecklist(raw.market_validation_checklist),
    competitive_advantages: parseCompetitiveAdvantages(raw.competitive_advantages),
  };
}

function parsePlaybook(raw) {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.slice(0, 3).map(item => ({
    risk: String(item.risk || "Unknown risk").trim(),
    severity: toScore(item.severity, 5),
    tactics: normalizeChecklist(item.tactics, "Develop mitigation strategy"),
  }));
}

function parseValidationChecklist(raw) {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.slice(0, 3).map(item => ({
    stage: String(item.stage || "Validation stage").trim(),
    timelineWeeks: toScore(item.timeline_weeks, 2),
    tasks: normalizeChecklist(item.tasks, "Conduct targeted validation test"),
  }));
}

function parseCompetitiveAdvantages(raw) {
  if (!raw) return { score: 5, strengths: [], weaknesses: [] };
  return {
    score: toScore(raw.score, 6),
    strengths: normalizeChecklist(raw.strengths, "Unique value proposition"),
    weaknesses: normalizeChecklist(raw.weaknesses, "Market saturation concerns"),
  };
}

function parseCompetitors(raw, competitionText) {
  const toCompetitor = (item, idx) => ({
    name: String(item?.name || `Competitor ${idx + 1}`).trim(),
    description: String(item?.description || "").trim(),
    edge: String(item?.edge || "").trim(),
  });

  if (Array.isArray(raw) && raw.length) {
    return raw.slice(0, 4).map((item, idx) => toCompetitor(item, idx));
  }

  if (raw && typeof raw === "object") {
    return [toCompetitor(raw, 0)];
  }

  if (typeof raw === "string" && raw.trim()) {
    const parsed = raw
      .split(/\n|;|\.|\|/)
      .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 4)
      .map((line, idx) => ({
        name: `Competitor ${idx + 1}`,
        description: line,
        edge: "Established local traction",
      }));

    if (parsed.length) {
      return parsed;
    }
  }

  if (competitionText && String(competitionText).trim()) {
    const inferred = String(competitionText)
      .split(/\n|;|\.|\|/)
      .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
      .filter((line) => line.length > 8)
      .slice(0, 3)
      .map((line, idx) => ({
        name: `Area competitor ${idx + 1}`,
        description: line,
        edge: "Existing customer familiarity",
      }));

    if (inferred.length) {
      return inferred;
    }
  }

  return [
    {
      name: "Area incumbent",
      description: "Existing local businesses already serving this need.",
      edge: "Established trust and repeat customers",
    },
    {
      name: "Regional challenger",
      description: "A nearby brand that can expand into your target area quickly.",
      edge: "Operational scale and marketing reach",
    },
    {
      name: "Digital-first alternative",
      description: "Online-first competitor offering a substitute customer experience.",
      edge: "Convenience and broad distribution",
    },
  ];
}

export async function generateBusinessAnalysis(idea, location) {
  const cleanIdea = sanitizeText(idea, 180);
  const cleanLocation = sanitizeText(location, 80);

  if (!cleanIdea || !cleanLocation) {
    throw createHttpError("Both idea and location are required.", 400);
  }

  if (cleanIdea.length < 3 || cleanLocation.length < 2) {
    throw createHttpError("Please provide a more specific idea and location.", 400);
  }

  if (!process.env.GROQ_API_KEY) {
    throw createHttpError("Missing GROQ_API_KEY in environment configuration.", 500);
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const prompt = `
Business Idea: ${cleanIdea}
Location: ${cleanLocation}

Return ONLY valid JSON. No markdown, no code fences, no explanation.
Keep all responses practical, sharp, and actionable for a startup dashboard.

{
  "headline": "Short strategic headline",
  "market_scope": "1-2 concise sentences describing the market",
  "target_customers": "1 concise sentence describing core customers",
  "investment_estimate": "single estimate with currency and range",
  "legal_requirements": "1-3 concise points",
  "legal_formalities_checklist": ["5-7 checklist items for registrations, licenses, tax, permits, compliance"],
  "competition": "1-2 concise sentences",
  "main_competitors": [
    {
      "name": "Competitor name in the area",
      "description": "Short description of what they do",
      "edge": "Why customers choose them"
    }
  ],
  "risks": "Brief paragraph on main risks",
  "opportunities": "Brief paragraph on key opportunities",
  "recommended_next_step": "1 specific next action",
  "key_questions": "3 short validation questions in one paragraph",
  "market_score": 1,
  "risk_score": 1,
  "capital_intensity": 1,
  "launch_speed": 1,
  "setup_cost": "estimated one-time setup cost (1-10 scale)",
  "monthly_operating_cost": "estimated monthly recurring cost (1-10 scale)",
  "unit_price": "average revenue per unit/customer (1-10 scale)",
  "confidence_drivers": ["3 factors increasing confidence in this idea"],
  "confidence_risks": ["3 factors reducing confidence in this idea"],
  "risk_mitigation_playbook": [
    {
      "risk": "Risk category name",
      "severity": 7,
      "tactics": ["Mitigation tactic 1", "Mitigation tactic 2", "Mitigation tactic 3"]
    }
  ],
  "market_validation_checklist": [
    {
      "stage": "Customer Validation",
      "timeline_weeks": 2,
      "tasks": ["Task 1", "Task 2", "Task 3"]
    },
    {
      "stage": "Competitive Validation",
      "timeline_weeks": 1,
      "tasks": ["Task 1", "Task 2"]
    },
    {
      "stage": "Financial Validation",
      "timeline_weeks": 2,
      "tasks": ["Task 1", "Task 2"]
    }
  ],
  "competitive_advantages": {
    "score": 7,
    "strengths": ["Advantage 1", "Advantage 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"]
  }
}
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  });

  const rawOutput = completion.choices?.[0]?.message?.content ?? "";
  const parsed = parseJsonFromText(rawOutput);

  return {
    success: true,
    result: normalizeAnalysis(parsed),
  };
}
