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
  };
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
Keep the response practical, sharp, and structured for a dashboard.

{
  "headline": "Short strategic headline",
  "market_scope": "1-2 concise sentences describing the market",
  "target_customers": "1 concise sentence describing core customers",
  "investment_estimate": "single estimate with currency and range",
  "legal_requirements": "1-3 concise points",
  "legal_formalities_checklist": [
    "5-7 concise checklist items for registrations, licenses, tax, permits, and compliance"
  ],
  "competition": "1-2 concise sentences",
  "risks": "A concise paragraph or short bullet-like sentences",
  "opportunities": "A concise paragraph or short bullet-like sentences",
  "recommended_next_step": "1 specific next action",
  "key_questions": "3 short validation questions in one concise paragraph",
  "market_score": 1,
  "risk_score": 1,
  "capital_intensity": 1,
  "launch_speed": 1
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
