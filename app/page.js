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
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
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

        <div className="hero__grid">
          <div className="hero__copy">
            <span className="eyebrow">Launch with clarity</span>
            <h1>Turn a rough idea into a structured market and execution dashboard.</h1>
            <p>
              Feed the system your business idea and location, then get a cleaner view of market scope,
              customer profile, risk, compliance, competition, and the next move.
            </p>

            <div className="hero__stats">
              <div>
                <strong>{workspaceCount}</strong>
                <span>Personal workspaces</span>
              </div>
              <div>
                <strong>4 scores</strong>
                <span>Decision-ready signal cards</span>
              </div>
              <div>
                <strong>{session.user?.name || "Guest"}</strong>
                <span>{session.authenticated ? "Authenticated workspace mode" : "Login required to analyze"}</span>
              </div>
            </div>

            <div className="hero__meta">
              <span>Source: {responseMeta.source}</span>
              <span>Generated: {responseMeta.generatedAt === "-" ? "-" : new Date(responseMeta.generatedAt).toLocaleString()}</span>
            </div>

            {reportId ? (
              <div className="hero__meta">
                <a className="subtle-btn" href={`/api/reports/${reportId}/export/csv`}>Export CSV</a>
                <a className="subtle-btn" href={`/api/reports/${reportId}/export/pdf`}>Export PDF</a>
                <button className="subtle-btn" onClick={createShareLink}>Generate share link</button>
              </div>
            ) : null}

            {shareUrl ? <p className="analysis-panel__note">Share link: <a href={shareUrl}>{shareUrl}</a></p> : null}
          </div>

          <form className="analysis-panel" onSubmit={handleAnalyze}>
            <div className="analysis-panel__header">
              <span>Idea input</span>
              <span>Dashboard generator</span>
            </div>

            {!session.authenticated ? (
              <p className="analysis-panel__error">Login or register to use personal workspaces and saved reports.</p>
            ) : (
              <>
                <label>
                  Workspace
                  <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)}>
                    {session.workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  New workspace
                  <input
                    value={newWorkspaceName}
                    onChange={(event) => setNewWorkspaceName(event.target.value)}
                    placeholder="E.g. Food startups"
                  />
                </label>

                <button type="button" onClick={createWorkspace}>Create workspace</button>
              </>
            )}

            <label>
              Business idea
              <input
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder="Coffee shop, logistics startup, AI tutor, wellness brand..."
              />
            </label>

            <label>
              Location
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Mumbai, Delhi, Bangalore, Dubai..."
              />
            </label>

            <button type="submit" disabled={loading || !canAnalyze}>
              {loading ? "Analyzing..." : "Generate dashboard"}
            </button>

            <p className="analysis-panel__note">
              The model returns structured JSON so the dashboard stays consistent and easy to scan.
            </p>

            {error ? <p className="analysis-panel__error">{error}</p> : null}
          </form>
        </div>
      </section>

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
            <span>Execution lens</span>
            <span>Operational depth</span>
          </div>

          <div className="roadmap">
            <h3>Recommended next step</h3>
            <p>{activeResult.recommended_next_step}</p>
          </div>
          <div className="roadmap legal-checklist-card">
            <h3>Legalities and formalities checklist</h3>
            <ul className="legal-checklist-list">
              {(activeResult.legal_formalities_checklist || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="roadmap">
            <h3>Key validation questions</h3>
            <p>{activeResult.key_questions}</p>
          </div>
        </aside>
      </section>

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
    </main>
  );
}
