"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TabNav } from "./components/TabNav";
import { FinancialDashboard } from "./components/FinancialDashboard";
import { ActionItemsTracker } from "./components/ActionItemsTracker";
import { SWOTandPositioning } from "./components/SWOTandPositioning";
import { InvestorReadinessChecklist } from "./components/InvestorReadinessChecklist";
import { BusinessPlanViewer } from "./components/BusinessPlanViewer";

const initialResult = {
  headline: "Strategic market snapshot",
  market_scope: "Enter an idea and location to generate a launch-ready analysis.",
  target_customers: "Founders, operators, and investors can use this dashboard to validate the concept.",
  investment_estimate: "No estimate yet",
  legal_requirements: "The compliance checklist will appear here.",
  legal_formalities_checklist: [
    "Business entity registration",
    "Tax registration and invoicing setup",
    "Industry-specific licenses and permits",
    "Local shop/office establishment compliance",
    "Employment and labor law compliance",
  ],
  competition: "Competition analysis will appear here.",
  risks: "Risk factors will appear here.",
  opportunities: "Opportunity areas will appear here.",
  recommended_next_step: "Run the analysis to see the first best move.",
  key_questions: "What customer segment has urgent demand? What is the fastest profitable offer? Which legal item is a blocker?",
  market_score: 0,
  risk_score: 0,
  capital_intensity: 0,
  launch_speed: 0,
  viability_index: 0,
  confidence_score: 0,
  confidence_note: "Confidence appears after the first analysis.",
  funding_readiness_score: 0,
  setup_cost: 0,
  monthly_operating_cost: 0,
  unit_price: 0,
  breakeven_units: 0,
  breakeven_months: 0,
  confidence_drivers: [],
  confidence_risks: [],
  risk_mitigation_playbook: [],
  market_validation_checklist: [],
  competitive_advantages: { score: 0, strengths: [], weaknesses: [] },
  main_competitors: [],
};

function scoreLabel(value) {
  if (value >= 8) return "Strong";
  if (value >= 6) return "Healthy";
  if (value >= 4) return "Moderate";
  return "Early";
}

function ScoreCard({ label, value, accent }) {
  const width = `${Math.max(6, value * 10)}%`;
  const trendData = [
    { step: "S1", score: Math.max(1, value - 3) },
    { step: "S2", score: Math.max(1, value - 2) },
    { step: "S3", score: Math.max(1, value - 1) },
    { step: "S4", score: value },
  ];
  const gradientId = `mini-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="score-card">
      <div className="score-card__top">
        <span>{label}</span>
        <strong>{value}/10</strong>
      </div>
      <div className="score-card__bar">
        <span style={{ width, background: accent }} />
      </div>
      <div className="score-card__spark">
        <ResponsiveContainer width="100%" height={52}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7ad6ff" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#7ad6ff" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="score"
              stroke="#7ad6ff"
              fill={`url(#${gradientId})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p>{scoreLabel(value)}</p>
    </div>
  );
}

function FieldCard({ title, value }) {
  return (
    <article className="field-card">
      <p>{title}</p>
      <h3>{value}</h3>
    </article>
  );
}

function CompetitorShowcase({ competitors, summary, location }) {
  const inferredFromSummary = typeof summary === "string"
    ? summary
        .split(/\n|;|\.|\|/)
        .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
        .filter((line) => line.length > 8)
        .slice(0, 3)
        .map((line, idx) => ({
          name: `Area competitor ${idx + 1}`,
          description: line,
          edge: "Existing local customer base",
        }))
    : [];

  const items = Array.isArray(competitors) && competitors.length
    ? competitors.filter(Boolean)
    : inferredFromSummary;

  return (
    <article className="card competitor-card">
      <div className="section-head">
        <span>Main competitors</span>
        <span>{location ? `In ${location}` : "Area scan"}</span>
      </div>
      <p className="competitor-summary">{summary || "Competitors and positioning notes will appear here."}</p>
      {items.length ? (
        <div className="competitor-grid">
          {items.map((competitor) => (
            <div key={competitor.name} className="competitor-item">
              <h4>{competitor.name}</h4>
              <p>{competitor.description || "No description available."}</p>
              {competitor.edge && <span>Edge: {competitor.edge}</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className="competitor-empty">
          <p>Run a fresh analysis to populate local competitors from the area.</p>
        </div>
      )}
    </article>
  );
}

function WorkflowTracker({ steps, currentStepIndex }) {
  const progress = steps.length > 1 ? (currentStepIndex / (steps.length - 1)) * 100 : 0;

  return (
    <article className="card tracker-card">
      <div className="section-head">
        <span>What you are doing</span>
        <span>Workflow tracker</span>
      </div>
      <p className="tracker-summary">{steps[currentStepIndex]?.detail}</p>
      <div className="tracker-bar" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="tracker-list">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={`tracker-step ${index < currentStepIndex ? "done" : ""} ${index === currentStepIndex ? "current" : ""}`}
          >
            <strong>{step.title}</strong>
            <span>{step.detail}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function FundingReadinessCard({ score, viability, confidence, market, capital }) {
  let status = "Not ready";
  let color = "#ff5f7a";
  
  if (score >= 8) {
    status = "Investor ready";
    color = "#2cd4a7";
  } else if (score >= 6) {
    status = "Near ready";
    color = "#ffd56b";
  } else if (score >= 4) {
    status = "Needs work";
    color = "#ff9b43";
  }

  return (
    <article className="card funding-card">
      <div className="section-head">
        <span>Investor readiness</span>
        <span>Funding potential</span>
      </div>
      <div className="funding-score">
        <div className="funding-display">
          <strong style={{ color }}>{score}/10</strong>
          <p>{status}</p>
        </div>
        <ul className="funding-factors">
          <li>Viability: <strong>{viability}/10</strong></li>
          <li>Confidence: <strong>{confidence}/10</strong></li>
          <li>Market: <strong>{market}/10</strong></li>
          <li>Capital efficiency: <strong>{capital}/10</strong></li>
        </ul>
      </div>
    </article>
  );
}

function BreakevenCalculator({ setupCost, monthlyOps, unitPrice, breakevenUnits, breakevenMonths }) {
  const formatCurrency = (num) => `$${Math.round(num).toLocaleString()}`;

  return (
    <article className="card breakeven-card">
      <div className="section-head">
        <span>Financial snapshot</span>
        <span>Unit economics</span>
      </div>
      <div className="breakeven-grid">
        <div className="breakeven-item">
          <p>Setup cost</p>
          <strong>{formatCurrency(setupCost)}</strong>
        </div>
        <div className="breakeven-item">
          <p>Monthly ops</p>
          <strong>{formatCurrency(monthlyOps)}</strong>
        </div>
        <div className="breakeven-item">
          <p>Unit price</p>
          <strong>{formatCurrency(unitPrice)}</strong>
        </div>
        <div className="breakeven-item">
          <p>Breakeven units/mo</p>
          <strong>{breakevenUnits}</strong>
        </div>
      </div>
      <div className="breakeven-projection">
        <p>
          <strong>Projected breakeven: {breakevenMonths}-{breakevenMonths + 3} months</strong>
        </p>
        <span className="note">Based on estimated setup and recurring costs</span>
      </div>
    </article>
  );
}

function ConfidenceReasoning({ drivers, risks, score }) {
  const reasoningColor = score >= 7 ? "#2cd4a7" : score >= 5 ? "#ffd56b" : "#ff8f6b";

  return (
    <article className="card confidence-card">
      <div className="section-head">
        <span>Why confidence at {score}/10?</span>
        <span style={{ color: reasoningColor }}>Reasoning breakdown</span>
      </div>
      <div className="confidence-breakdown">
        <div className="confidence-section">
          <h4>✅ Confidence drivers</h4>
          <ul>
            {drivers.slice(0, 3).map((driver) => (
              <li key={driver}>{driver}</li>
            ))}
          </ul>
        </div>
        <div className="confidence-section">
          <h4>⚠️ Risk factors</h4>
          <ul>
            {risks.slice(0, 3).map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function RiskMitigationPlaybook({ playbook }) {
  if (!playbook || playbook.length === 0) {
    return null;
  }

  return (
    <article className="card playbook-card">
      <div className="section-head">
        <span>Risk mitigation playbook</span>
        <span>Tactics by category</span>
      </div>
      {playbook.map((item, idx) => (
        <div key={idx} className="playbook-item">
          <div className="playbook-header">
            <h4>{item.risk}</h4>
            <span className="severity-badge" data-severity={item.severity}>
              Severity: {item.severity}/10
            </span>
          </div>
          <ul className="tactics-list">
            {item.tactics.map((tactic) => (
              <li key={tactic}>{tactic}</li>
            ))}
          </ul>
        </div>
      ))}
    </article>
  );
}

function ValidationChecklist({ checklist }) {
  const [checkedTasks, setCheckedTasks] = useState({});

  useEffect(() => {
    setCheckedTasks({});
  }, [checklist]);

  if (!checklist || checklist.length === 0) {
    return null;
  }

  return (
    <article className="card validation-card">
      <div className="section-head">
        <span>Pre-launch validation</span>
        <span>Testing roadmap</span>
      </div>
      {checklist.map((stage, idx) => (
        <div key={idx} className="validation-stage">
          <div className="stage-header">
            <h4>{stage.stage}</h4>
            <span className="timeline-badge">{stage.timelineWeeks} weeks</span>
          </div>
          <ul className="task-list">
            {stage.tasks.map((task) => (
              <li key={`${stage.stage}-${idx}-${task}`}>
                <input
                  type="checkbox"
                  checked={!!checkedTasks[`${stage.stage}-${idx}-${task}`]}
                  onChange={() =>
                    setCheckedTasks((current) => ({
                      ...current,
                      [`${stage.stage}-${idx}-${task}`]: !current[`${stage.stage}-${idx}-${task}`],
                    }))
                  }
                />
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </article>
  );
}

function CompetitiveAdvantagesCard({ advantages }) {
  if (!advantages) {
    return null;
  }

  const { score, strengths, weaknesses } = advantages;
  const statusColor = score >= 7 ? "#2cd4a7" : score >= 5 ? "#ffd56b" : "#ff8f6b";

  return (
    <article className="card competitive-card">
      <div className="section-head">
        <span>Competitive positioning</span>
        <span style={{ color: statusColor }}>Advantage score {score}/10</span>
      </div>
      <div className="advantages-grid">
        <div className="advantage-section">
          <h4>💪 Your strengths</h4>
          <ul>
            {strengths.slice(0, 3).map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </div>
        <div className="advantage-section weakness">
          <h4>⚠️ Weaknesses</h4>
          <ul>
            {weaknesses.slice(0, 3).map((weakness) => (
              <li key={weakness}>{weakness}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function CollapsibleSection({ title, subtitle, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <article className="card collapsible-section">
      <button
        className="section-toggle"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className="section-head">
          <span>{title}</span>
          <span>{subtitle}</span>
        </div>
        <span className="toggle-icon">{isOpen ? "▼" : "▶"}</span>
      </button>
      {isOpen && <div className="section-content">{children}</div>}
    </article>
  );
}

function ResultsOverview({ result, meta }) {
  return (
    <article className="card results-overview">
      <div className="overview-header">
        <h2>{result.headline}</h2>
        <p className="overview-meta">
          <span>Analysis: {meta.source === "cache" ? "Cached" : "Live"}</span>
          {meta.generatedAt !== "-" && (
            <span>{new Date(meta.generatedAt).toLocaleDateString()}</span>
          )}
        </p>
      </div>

      <div className="overview-grid">
        <div className="overview-stat">
          <span className="stat-label">Overall Viability</span>
          <strong className="stat-value">{result.viability_index}/10</strong>
          <span className="stat-sub">
            {result.viability_index >= 8
              ? "Strong potential"
              : result.viability_index >= 6
              ? "Viable with work"
              : result.viability_index >= 4
              ? "Needs improvement"
              : "Significant risk"}
          </span>
        </div>

        <div className="overview-stat">
          <span className="stat-label">Investor Ready</span>
          <strong className="stat-value">{result.funding_readiness_score}/10</strong>
          <span className="stat-sub">
            {result.funding_readiness_score >= 8
              ? "Pitch-ready"
              : result.funding_readiness_score >= 6
              ? "Close"
              : "Keep building"}
          </span>
        </div>

        <div className="overview-stat">
          <span className="stat-label">Confidence</span>
          <strong className="stat-value">{result.confidence_score}/10</strong>
          <span className="stat-sub">
            {result.confidence_note.split(" ")[0]}
          </span>
        </div>

        <div className="overview-stat">
          <span className="stat-label">Launch Timeline</span>
          <strong className="stat-value">{result.launch_speed}/10</strong>
          <span className="stat-sub">
            {result.launch_speed >= 8
              ? "Quick to market"
              : result.launch_speed >= 6
              ? "Moderate pace"
              : "Slower timeline"}
          </span>
        </div>
      </div>
    </article>
  );
}

function ActionButtons({ reportId, loading, onShare, shareUrl }) {
  return (
    <div className="action-buttons">
      {reportId && (
        <>
          <a
            href={`/api/reports/${reportId}/export/csv`}
            className="action-btn action-btn--secondary"
            download
          >
            📊 Export CSV
          </a>
          <a
            href={`/api/reports/${reportId}/export/pdf`}
            className="action-btn action-btn--secondary"
            download
          >
            📄 Export PDF
          </a>
          <button className="action-btn action-btn--primary" onClick={onShare}>
            🔗 {shareUrl ? "Copied!" : "Share"}
          </button>
        </>
      )}
    </div>
  );
}

function ComparisonModal({
  idea1,
  idea2,
  comparisonDraft,
  comparisonLoading,
  onChangeDraft,
  onGenerateComparison,
  onClose,
  onResetComparison,
}) {
  if (!idea1) return null;

  const metrics = [
    { label: "Market", key: "market_score", higherIsBetter: true },
    { label: "Risk", key: "risk_score", higherIsBetter: false },
    { label: "Capital", key: "capital_intensity", higherIsBetter: false },
    { label: "Speed", key: "launch_speed", higherIsBetter: true },
    { label: "Viability", key: "viability_index", higherIsBetter: true },
    { label: "Confidence", key: "confidence_score", higherIsBetter: true },
  ];

  const comparisonHeadline = idea2?.headline || "Pending comparison";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Idea Comparison</h2>
          <button className="modal-close" onClick={onClose} type="button">✕</button>
        </div>

        {!idea2 ? (
          <form className="comparison-form" onSubmit={onGenerateComparison}>
            <div className="form-row">
              <label>
                <span className="label-text">Second idea</span>
                <input
                  value={comparisonDraft.idea}
                  onChange={(event) => onChangeDraft("idea", event.target.value)}
                  placeholder="Coffee kiosk, AI tutor, food delivery, etc."
                />
              </label>
              <label>
                <span className="label-text">Location</span>
                <input
                  value={comparisonDraft.location}
                  onChange={(event) => onChangeDraft("location", event.target.value)}
                  placeholder="Same market or another city"
                />
              </label>
            </div>

            <button className="btn-primary" type="submit" disabled={comparisonLoading || !comparisonDraft.idea.trim()}>
              {comparisonLoading ? "Comparing..." : "Generate comparison"}
            </button>
          </form>
        ) : (
          <>
            <div className="comparison-summary">
              <div className="comparison-summary__item">
                <p>Idea 1</p>
                <strong>{idea1.headline || "Current idea"}</strong>
              </div>
              <div className="comparison-summary__item">
                <p>Idea 2</p>
                <strong>{comparisonHeadline}</strong>
              </div>
              <button className="btn-secondary" type="button" onClick={onResetComparison}>
                Compare another idea
              </button>
            </div>

            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>{idea1.headline || "Idea 1"}</th>
                  <th>{comparisonHeadline}</th>
                  <th>Winner</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => {
                  const val1 = Number(idea1[metric.key] ?? 0);
                  const val2 = Number(idea2[metric.key] ?? 0);
                  const winner = metric.higherIsBetter
                    ? val1 > val2
                      ? "1"
                      : val1 < val2
                      ? "2"
                      : "tie"
                    : val1 < val2
                    ? "1"
                    : val1 > val2
                    ? "2"
                    : "tie";

                  return (
                    <tr key={metric.key}>
                      <td><strong>{metric.label}</strong></td>
                      <td>{val1}</td>
                      <td>{val2}</td>
                      <td className={`winner-${winner}`}>{winner === "tie" ? "Tie" : `Idea ${winner}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseMeta, setResponseMeta] = useState({ source: "-", generatedAt: "-" });
  const [session, setSession] = useState({ authenticated: false, user: null, workspaces: [] });
  const [workspaceId, setWorkspaceId] = useState("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [reportId, setReportId] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [comparisonIdea, setComparisonIdea] = useState(null);
  const [comparisonDraft, setComparisonDraft] = useState({ idea: "", location: "" });
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  // Advanced analysis state
  const [activeTab, setActiveTab] = useState("overview");
  const [advancedData, setAdvancedData] = useState(null);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedGenerated, setAdvancedGenerated] = useState(false);

  const activeResult = result ?? initialResult;
  const canAnalyze = session.authenticated && workspaceId;

  const workspaceCount = useMemo(() => session.workspaces?.length || 0, [session.workspaces]);
  const scoreRadarData = useMemo(
    () => [
      { metric: "Market", value: activeResult.market_score },
      { metric: "Risk", value: 11 - activeResult.risk_score },
      { metric: "Capital", value: 11 - activeResult.capital_intensity },
      { metric: "Speed", value: activeResult.launch_speed },
      { metric: "Viability", value: activeResult.viability_index },
      { metric: "Confidence", value: activeResult.confidence_score },
    ],
    [activeResult]
  );

  const operationalBarData = useMemo(
    () => [
      { name: "Demand", score: activeResult.market_score },
      { name: "Compliance", score: Math.min(10, Math.max(1, activeResult.legal_formalities_checklist?.length || 1)) },
      { name: "Risk", score: 11 - activeResult.risk_score },
      { name: "Launch", score: activeResult.launch_speed },
    ],
    [activeResult]
  );

  const workflowSteps = useMemo(
    () => [
      {
        title: "Define the idea",
        detail: idea ? idea : "Enter a business concept to start tracking progress.",
      },
      {
        title: "Analyze the market",
        detail: reportId ? "Market analysis is complete and saved to the workspace." : "Generate the first report to begin analysis.",
      },
      {
        title: "Review competitors",
        detail: activeResult.main_competitors?.length
          ? `${activeResult.main_competitors.length} competitors identified in the area.`
          : "Competitor names will populate after analysis.",
      },
      {
        title: "Validate and compare",
        detail: showComparison
          ? comparisonIdea
            ? "Comparison mode is ready with a second idea."
            : "Enter a second idea to compare side by side."
          : "Open comparison mode when you want a second option.",
      },
    ],
    [idea, reportId, activeResult.main_competitors, showComparison, comparisonIdea]
  );

  const workflowStepIndex = useMemo(() => {
    if (!idea) return 0;
    if (!reportId) return 1;
    if (showComparison && !comparisonIdea) return 3;
    if (comparisonIdea) return 3;
    return 2;
  }, [idea, reportId, showComparison, comparisonIdea]);

  async function refreshSession() {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const data = await response.json();
    setSession(data);

    if (data.authenticated && data.workspaces?.length && !workspaceId) {
      setWorkspaceId(data.workspaces[0].id);
    }
  }

  async function handleAnalyze(event) {
    event.preventDefault();
    if (!canAnalyze) return;

    setLoading(true);
    setError("");
    setShareUrl("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea, location, workspaceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to analyze this idea right now.");
      }

      setResult(data.result);
      setResponseMeta(data.meta || { source: "live", generatedAt: new Date().toISOString() });
      setReportId(data.reportId || "");
      setAdvancedData(null);
      setAdvancedGenerated(false);
      setActiveTab("overview");
      setComparisonIdea(null);
      setComparisonDraft({ idea: "", location: "" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleComparisonAnalyze(event) {
    event.preventDefault();

    if (!canAnalyze || !comparisonDraft.idea.trim()) return;

    setComparisonLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea: comparisonDraft.idea,
          location: comparisonDraft.location,
          workspaceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to analyze the comparison idea right now.");
      }

      setComparisonIdea(data.result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setComparisonLoading(false);
    }
  }

  async function createWorkspace(event) {
    event.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create workspace.");
      }

      setNewWorkspaceName("");
      await refreshSession();
      setWorkspaceId(data.workspace.id);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ authenticated: false, user: null, workspaces: [] });
    setWorkspaceId("");
    setReportId("");
  }

  async function createShareLink() {
    if (!reportId) return;

    const response = await fetch(`/api/reports/${reportId}/share`, { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Unable to generate share link.");
      return;
    }

    setShareUrl(data.shareUrl);
  }

  function updateComparisonDraft(field, value) {
    setComparisonDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetComparison() {
    setComparisonIdea(null);
  }

  async function loadAdvancedAnalysis() {
    if (!reportId) return;
    setAdvancedLoading(true);
    try {
      const response = await fetch(`/api/advanced/${reportId}`);
      const data = await response.json();
      if (response.ok) {
        setAdvancedData(data);
        setAdvancedGenerated(Boolean(
          data?.financials ||
          data?.positioning ||
          data?.swot ||
          data?.checklist ||
          data?.businessPlan ||
          (Array.isArray(data?.actions) && data.actions.length > 0)
        ));
      }
    } catch (err) {
      setError("Failed to load advanced analysis");
    } finally {
      setAdvancedLoading(false);
    }
  }

  async function generateAdvancedAnalysis() {
    if (!reportId) return;
    setAdvancedLoading(true);
    try {
      const response = await fetch("/api/advanced/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = await response.json();
      if (response.ok) {
        setAdvancedGenerated(true);
        await loadAdvancedAnalysis();
      } else {
        setError(data.error || "Failed to generate advanced analysis");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAdvancedLoading(false);
    }
  }

  async function updateActionItem(actionId, updates) {
    try {
      const response = await fetch(`/api/advanced/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        await loadAdvancedAnalysis();
      }
    } catch (err) {
      setError("Failed to update action item");
    }
  }

  async function deleteActionItem(actionId) {
    try {
      await fetch(`/api/advanced/actions/${actionId}`, { method: "DELETE" });
      await loadAdvancedAnalysis();
    } catch (err) {
      setError("Failed to delete action item");
    }
  }

  useEffect(() => {
    if (reportId) {
      loadAdvancedAnalysis();
    }
  }, [reportId]);

  useEffect(() => {
    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="app-shell">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <div className="ambient ambient--three" />

      <section className="hero card">
        <header className="topbar">
          <div>
            <span className="brand-block">
              <img src="/pravideon-logo.png" alt="Expa AI logo" className="brand-logo" />
              <span className="brand-mark">Expa AI</span>
            </span>
            <p className="topbar__sub">Business idea intelligence dashboard</p>
          </div>
          <div className="topbar-actions">
            {session.authenticated ? (
              <>
                <Link className="subtle-btn" href="/history">View history</Link>
                <button className="subtle-btn" onClick={logout}>Logout</button>
              </>
            ) : (
              <Link className="subtle-btn" href="/auth">Login / Register</Link>
            )}
            <div className="status-pill">AI analysis ready</div>
          </div>
        </header>

        <div className="hero__grid hero__grid--single">
          <form className="analysis-panel analysis-panel--full" onSubmit={handleAnalyze}>
            <div className="analysis-panel__header">
              <div>
                <h2>Analyze Your Idea</h2>
                <p>Get a detailed business intelligence report in seconds</p>
              </div>
            </div>

            {!session.authenticated ? (
              <p className="analysis-panel__error">Login or register to use personal workspaces and saved reports.</p>
            ) : (
              <>
                <div className="form-row">
                  <label>
                    <span className="label-text">Business idea</span>
                    <input
                      value={idea}
                      onChange={(event) => setIdea(event.target.value)}
                      placeholder="Coffee shop, logistics startup, AI tutor, wellness brand..."
                    />
                  </label>
                  <label>
                    <span className="label-text">Location</span>
                    <input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="Mumbai, Delhi, Bangalore, Dubai..."
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    <span className="label-text">Workspace</span>
                    <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)}>
                      {session.workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="label-text">Create new workspace</span>
                    <div className="workspace-input-group">
                      <input
                        value={newWorkspaceName}
                        onChange={(event) => setNewWorkspaceName(event.target.value)}
                        placeholder="E.g. Food startups"
                      />
                      <button type="button" onClick={createWorkspace} className="btn-secondary">
                        Add
                      </button>
                    </div>
                  </label>
                </div>

                <button type="submit" disabled={loading || !canAnalyze} className="btn-primary">
                  {loading ? (
                    <>
                      <span className="spinner" /> Analyzing...
                    </>
                  ) : (
                    "Generate Dashboard"
                  )}
                </button>

                {error && <p className="analysis-panel__error">{error}</p>}
              </>
            )}
          </form>

          <div className="hero__side">
            <div className="hero__info">
              <h3>Quick Overview</h3>
              <ul>
                <li>✓ Market & viability scoring</li>
                <li>✓ Financials & breakeven</li>
                <li>✓ Risk & mitigation tactics</li>
                <li>✓ Validation checklist</li>
                <li>✓ Competitive positioning</li>
                <li>✓ Export & share reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <WorkflowTracker steps={workflowSteps} currentStepIndex={workflowStepIndex} />

      <section className="dashboard-grid">
        <article className="card insight-panel">
          <div className="section-head">
            <span>Strategy overview</span>
            <span>{activeResult.headline}</span>
          </div>

          <div className="score-grid">
            <ScoreCard label="Market strength" value={activeResult.market_score} accent="linear-gradient(90deg, #69d2ff, #7c5cff)" />
            <ScoreCard label="Risk level" value={activeResult.risk_score} accent="linear-gradient(90deg, #ff8f6b, #ff5f7a)" />
            <ScoreCard label="Capital intensity" value={activeResult.capital_intensity} accent="linear-gradient(90deg, #ffd56b, #ff9b43)" />
            <ScoreCard label="Launch speed" value={activeResult.launch_speed} accent="linear-gradient(90deg, #6effb1, #2cd4a7)" />
          </div>

          <div className="field-grid">
            <FieldCard title="Market scope" value={activeResult.market_scope} />
            <FieldCard title="Target customers" value={activeResult.target_customers} />
            <FieldCard title="Investment estimate" value={activeResult.investment_estimate} />
            <FieldCard title="Competition" value={activeResult.competition} />
          </div>

          <CompetitorShowcase
            competitors={activeResult.main_competitors}
            summary={activeResult.competition}
            location={location}
          />

          <div className="signal-strip">
            <article>
              <p>Viability index</p>
              <strong>{activeResult.viability_index}/10</strong>
            </article>
            <article>
              <p>Confidence</p>
              <strong>{activeResult.confidence_score}/10</strong>
            </article>
            <article>
              <p>Confidence note</p>
              <strong>{activeResult.confidence_note}</strong>
            </article>
          </div>
        </article>

        <aside className="card side-panel">
          <div className="section-head">
            <span>Quick actions</span>
            <span>Next steps</span>
          </div>

          <div className="roadmap">
            <h3>Recommended next step</h3>
            <p>{activeResult.recommended_next_step}</p>
          </div>
          <div className="roadmap legal-checklist-card">
            <h3>Key items to handle</h3>
            <ul className="legal-checklist-list">
              {(activeResult.legal_formalities_checklist || []).slice(0, 5).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="roadmap">
            <h3>Test these questions</h3>
            <p>{activeResult.key_questions}</p>
          </div>
        </aside>
      </section>

      {reportId && (
        <ActionButtons
          reportId={reportId}
          loading={loading}
          onShare={createShareLink}
          shareUrl={shareUrl}
        />
      )}

      {reportId && (
        <>
          <TabNav
            tabs={[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "financials", label: "Financials", icon: "💰", badge: advancedGenerated ? "" : "NEW" },
              { id: "actions", label: "Action Items", icon: "✓", badge: advancedData?.actions?.length || 0 },
              { id: "positioning", label: "Positioning", icon: "🗺️" },
              { id: "investor", label: "Investor Ready", icon: "📈" },
              { id: "plan", label: "Business Plan", icon: "📋" },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {!advancedGenerated && activeTab !== "overview" && (
            <article className="card">
              <div className="section-head">
                <span>Advanced Analysis Not Generated</span>
                <span>Click button below to unlock all features</span>
              </div>
              <button
                className="btn-primary"
                onClick={generateAdvancedAnalysis}
                disabled={advancedLoading}
              >
                {advancedLoading ? "Generating..." : "🚀 Generate Advanced Analysis"}
              </button>
              <p className="empty-state" style={{ marginTop: "16px", fontSize: "0.85rem" }}>
                This generates financial projections, action items, SWOT analysis, positioning map, investor checklist, and a complete business plan.
              </p>
            </article>
          )}
        </>
      )}

      {reportId && (
        <>
          {activeTab === "overview" && (
            <>
              {!advancedGenerated && (
                <article className="card" style={{ marginBottom: "40px", padding: "24px", textAlign: "center" }}>
                  <h3 style={{ marginTop: 0 }}>Ready to dive deeper?</h3>
                  <p>Unlock comprehensive financial projections, action items, SWOT analysis, and more.</p>
                  <button
                    className="btn-primary"
                    onClick={generateAdvancedAnalysis}
                    disabled={advancedLoading}
                  >
                    {advancedLoading ? "Generating..." : "🚀 Generate Advanced Analysis"}
                  </button>
                </article>
              )}
            </>
          )}

          {activeTab === "financials" && advancedGenerated && (
            <FinancialDashboard reportId={reportId} financials={advancedData?.financials} loading={advancedLoading} />
          )}

          {activeTab === "actions" && advancedGenerated && (
            <ActionItemsTracker
              reportId={reportId}
              actions={advancedData?.actions || []}
              onUpdateAction={updateActionItem}
              onDeleteAction={deleteActionItem}
              loading={advancedLoading}
            />
          )}

          {activeTab === "positioning" && advancedGenerated && (
            <SWOTandPositioning
              swot={advancedData?.swot}
              positioning={advancedData?.positioning}
              loading={advancedLoading}
            />
          )}

          {activeTab === "investor" && advancedGenerated && (
            <InvestorReadinessChecklist checklist={advancedData?.checklist} loading={advancedLoading} />
          )}

          {activeTab === "plan" && advancedGenerated && (
            <BusinessPlanViewer reportId={reportId} businessPlan={advancedData?.businessPlan} loading={advancedLoading} />
          )}
        </>
      )}

      {reportId && activeTab === "overview" && (
        <>
          <ResultsOverview result={activeResult} meta={responseMeta} />

          <div className="dashboard-sections">
            <section className="section-group">
              <h3 className="section-group-title">📊 Analysis & Positioning</h3>

              <section className="visual-grid">
                <article className="card chart-card">
                  <div className="section-head">
                    <span>Decision geometry</span>
                    <span>Radar profile</span>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={290}>
                      <RadarChart data={scoreRadarData}>
                        <PolarGrid stroke="rgba(171, 199, 255, 0.2)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "#d4e4ff", fontSize: 12 }} />
                        <Radar
                          dataKey="value"
                          stroke="#69d2ff"
                          fill="rgba(105, 210, 255, 0.38)"
                          fillOpacity={0.9}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="card chart-card">
                  <div className="section-head">
                    <span>Execution readiness</span>
                    <span>Bar comparison</span>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={290}>
                      <BarChart data={operationalBarData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(171, 199, 255, 0.16)" />
                        <XAxis dataKey="name" tick={{ fill: "#d4e4ff", fontSize: 12 }} />
                        <YAxis domain={[0, 10]} tick={{ fill: "#a9bfdd", fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="score" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7c5cff" />
                            <stop offset="100%" stopColor="#69d2ff" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </section>

              <section className="insights-grid">
                <FundingReadinessCard
                  score={activeResult.funding_readiness_score}
                  viability={activeResult.viability_index}
                  confidence={activeResult.confidence_score}
                  market={activeResult.market_score}
                  capital={11 - activeResult.capital_intensity}
                />
                <BreakevenCalculator
                  setupCost={activeResult.setup_cost}
                  monthlyOps={activeResult.monthly_operating_cost}
                  unitPrice={activeResult.unit_price}
                  breakevenUnits={activeResult.breakeven_units}
                  breakevenMonths={activeResult.breakeven_months}
                />
              </section>

              <CompetitiveAdvantagesCard advantages={activeResult.competitive_advantages} />
            </section>

            <section className="section-group">
              <h3 className="section-group-title">⚠️ Risk & Mitigation</h3>

              <ConfidenceReasoning
                drivers={activeResult.confidence_drivers}
                risks={activeResult.confidence_risks}
                score={activeResult.confidence_score}
              />

              <RiskMitigationPlaybook playbook={activeResult.risk_mitigation_playbook} />
            </section>

            <section className="section-group">
              <h3 className="section-group-title">🧪 Validation & Testing</h3>

              <ValidationChecklist checklist={activeResult.market_validation_checklist} />
            </section>

            {reportId && !showComparison && (
              <section className="section-group">
                <h3 className="section-group-title">🔄 Want to compare?</h3>
                <div className="comparison-section">
                  <button className="cta-btn" onClick={() => setShowComparison(true)}>
                    + Compare with another idea
                  </button>
                </div>
              </section>
            )}
          </div>

          {showComparison && (
            <ComparisonModal
              idea1={activeResult}
              idea2={comparisonIdea}
              comparisonDraft={comparisonDraft}
              comparisonLoading={comparisonLoading}
              onChangeDraft={updateComparisonDraft}
              onGenerateComparison={handleComparisonAnalyze}
              onClose={() => setShowComparison(false)}
              onResetComparison={resetComparison}
            />
          )}
        </>
      )}
    </main>
  );
}
