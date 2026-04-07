import Link from "next/link";
import { getSharedReport } from "../../../lib/report-service.js";

export const dynamic = "force-dynamic";

export default async function SharedReportPage({ params }) {
  const shared = await getSharedReport(params.token);

  if (!shared || !shared.report) {
    return (
      <main className="app-shell">
        <section className="card history-hero">
          <h1>Shared report not found</h1>
          <p className="topbar__sub">This link may be invalid or the report was removed.</p>
          <Link href="/" className="subtle-btn">Open Expa AI</Link>
        </section>
      </main>
    );
  }

  const result = JSON.parse(shared.report.resultJson);

  return (
    <main className="app-shell">
      <section className="card history-hero">
        <span className="brand-block">
          <img src="/pravideon-logo.png" alt="Expa AI logo" className="brand-logo" />
          <span className="brand-mark">Expa AI</span>
        </span>
        <p className="history-kicker">Shared report</p>
        <h1>{shared.report.idea}</h1>
        <p className="topbar__sub">Location: {shared.report.location}</p>
      </section>

      <section className="card details-grid">
        <div>
          <div className="detail-card">
            <h3>Headline</h3>
            <p>{result.headline}</p>
          </div>
          <div className="detail-card">
            <h3>Market scope</h3>
            <p>{result.market_scope}</p>
          </div>
          <div className="detail-card">
            <h3>Target customers</h3>
            <p>{result.target_customers}</p>
          </div>
          <div className="detail-card">
            <h3>Investment estimate</h3>
            <p>{result.investment_estimate}</p>
          </div>
        </div>
        <div>
          <div className="detail-card">
            <h3>Legal requirements</h3>
            <p>{result.legal_requirements}</p>
          </div>
          <div className="detail-card">
            <h3>Legalities and formalities checklist</h3>
            <ul className="legal-checklist-list">
              {(result.legal_formalities_checklist || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="detail-card">
            <h3>Risks</h3>
            <p>{result.risks}</p>
          </div>
          <div className="detail-card">
            <h3>Opportunities</h3>
            <p>{result.opportunities}</p>
          </div>
          <div className="detail-card">
            <h3>Confidence</h3>
            <p>{result.confidence_note}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
