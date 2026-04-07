"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

export default function HistoryPage() {
  const [session, setSession] = useState({ authenticated: false, user: null, workspaces: [] });
  const [workspaceId, setWorkspaceId] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalRuns = items.length;

  const averageMarketScore = useMemo(() => {
    if (!items.length) return 0;

    const total = items.reduce((acc, item) => acc + (item.result?.market_score || 0), 0);
    return (total / items.length).toFixed(1);
  }, [items]);

  const averageViability = useMemo(() => {
    if (!items.length) return 0;

    const total = items.reduce((acc, item) => acc + (item.result?.viability_index || 0), 0);
    return (total / items.length).toFixed(1);
  }, [items]);

  const averageConfidence = useMemo(() => {
    if (!items.length) return 0;

    const total = items.reduce((acc, item) => acc + (item.result?.confidence_score || 0), 0);
    return (total / items.length).toFixed(1);
  }, [items]);

  const trendData = useMemo(
    () =>
      items
        .slice()
        .reverse()
        .map((item, index) => ({
          run: index + 1,
          viability: item.result?.viability_index || 0,
          confidence: item.result?.confidence_score || 0,
        })),
    [items]
  );

  async function fetchHistory(activeWorkspaceId) {
    setLoading(true);
    setError("");

    try {
      const query = activeWorkspaceId ? `?workspaceId=${activeWorkspaceId}` : "";
      const response = await fetch(`/api/history${query}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load history");
      }

      setItems(data.items || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    try {
      const query = workspaceId ? `?workspaceId=${workspaceId}` : "";
      const response = await fetch(`/api/history${query}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Unable to clear history");
      }

      setItems([]);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    async function init() {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await response.json();
      setSession(data);

      if (data.authenticated) {
        const defaultWorkspaceId = data.workspaces?.[0]?.id || "";
        setWorkspaceId(defaultWorkspaceId);
        await fetchHistory(defaultWorkspaceId);
      } else {
        setLoading(false);
      }
    }

    init();
  }, []);

  async function handleWorkspaceChange(event) {
    const nextWorkspace = event.target.value;
    setWorkspaceId(nextWorkspace);
    await fetchHistory(nextWorkspace);
  }

  return (
    <main className="app-shell">
      <section className="card history-hero">
        <header className="history-head">
          <div>
            <span className="brand-block">
              <img src="/pravideon-logo.png" alt="Expa AI logo" className="brand-logo" />
              <span className="brand-mark">Expa AI</span>
            </span>
            <p className="history-kicker">Expa AI history</p>
            <h1>Past analyses and trend signals</h1>
          </div>
          <div className="history-actions">
            <Link href="/" className="subtle-btn">Back to dashboard</Link>
            <button className="danger-btn" onClick={handleClear}>Clear history</button>
          </div>
        </header>

        {!session.authenticated ? (
          <p className="analysis-panel__error">Please login to view your personal history.</p>
        ) : (
          <div className="history-actions">
            <label>
              Workspace
              <select value={workspaceId} onChange={handleWorkspaceChange}>
                {session.workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="history-stats">
          <article>
            <p>Total runs</p>
            <strong>{totalRuns}</strong>
          </article>
          <article>
            <p>Avg market score</p>
            <strong>{averageMarketScore}</strong>
          </article>
          <article>
            <p>Data source</p>
            <strong>Local file store</strong>
          </article>
          <article>
            <p>Avg viability</p>
            <strong>{averageViability}</strong>
          </article>
          <article>
            <p>Avg confidence</p>
            <strong>{averageConfidence}</strong>
          </article>
        </div>
      </section>

      <section className="card history-list-card">
        {loading ? <p>Loading history...</p> : null}
        {error ? <p className="analysis-panel__error">{error}</p> : null}

        {!loading && !items.length ? (
          <p className="empty-state">No analyses yet. Run an analysis from the main dashboard.</p>
        ) : null}

        <div className="history-list">
          {items.map((item) => (
            <article className="history-item" key={item.id}>
              <div className="history-item__top">
                <h2>{item.idea}</h2>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <p className="history-item__meta">{item.location}</p>
              <p>{item.result?.headline}</p>
              <div className="history-item__scores">
                <span>Market {item.result?.market_score}/10</span>
                <span>Risk {item.result?.risk_score}/10</span>
                <span>Capital {item.result?.capital_intensity}/10</span>
                <span>Launch {item.result?.launch_speed}/10</span>
                <span>Viability {item.result?.viability_index || 0}/10</span>
                <span>Confidence {item.result?.confidence_score || 0}/10</span>
              </div>
              <div className="history-actions">
                <a className="subtle-btn" href={`/api/reports/${item.id}/export/csv`}>CSV</a>
                <a className="subtle-btn" href={`/api/reports/${item.id}/export/pdf`}>PDF</a>
                {item.shareToken ? <a className="subtle-btn" href={`/share/${item.shareToken}`}>Shared link</a> : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card history-list-card history-chart-card">
        <div className="section-head">
          <span>Workspace trend</span>
          <span>Viability vs confidence over time</span>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="viabilityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#69d2ff" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#69d2ff" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="confidenceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#7c5cff" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(171, 199, 255, 0.16)" />
              <XAxis dataKey="run" tick={{ fill: "#d4e4ff", fontSize: 12 }} />
              <YAxis domain={[0, 10]} tick={{ fill: "#a9bfdd", fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="viability" stroke="#69d2ff" fill="url(#viabilityFill)" />
              <Area type="monotone" dataKey="confidence" stroke="#7c5cff" fill="url(#confidenceFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}
