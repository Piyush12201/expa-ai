import Link from "next/link";

const highlights = [
  { title: "AI Market Scans", text: "Context-rich opportunity analysis with location-level framing." },
  { title: "Investor Mode", text: "Financial projections, SWOT, and readiness artifacts in one flow." },
  { title: "Execution Layer", text: "Action items and tactical checklists that turn insights into momentum." },
];

const stats = [
  { label: "Signal Models", value: "12+" },
  { label: "Report Sections", value: "40" },
  { label: "Export Formats", value: "CSV/PDF" },
  { label: "Realtime Tabs", value: "6" },
];

const ideologyPillars = [
  {
    title: "Clarity Over Noise",
    text: "Every output should reduce founder uncertainty and make the next decision obvious.",
  },
  {
    title: "Actionable Intelligence",
    text: "Insights are paired with practical execution steps, not passive dashboards.",
  },
  {
    title: "Investor-Ready Thinking",
    text: "We frame ideas in language that works for capital, strategy, and operations.",
  },
];

const signalNodes = [
  { title: "Market Fit", value: 88 },
  { title: "Unit Economics", value: 74 },
  { title: "Competitive Edge", value: 81 },
  { title: "Launch Readiness", value: 69 },
];

export default function LandingPage() {
  const marqueeItems = [
    "Market Scope Intelligence",
    "Financial Projections",
    "SWOT + Positioning",
    "Investor Checklists",
    "Business Plan Export",
    "Workspace History",
    "Market Scope Intelligence",
    "Financial Projections",
  ];

  return (
    <main className="landing-shell">
      <div className="landing-orb landing-orb--one" />
      <div className="landing-orb landing-orb--two" />
      <div className="landing-grid" />

      <header className="landing-topbar">
        <div className="landing-brand landing-anim landing-anim--slide" style={{ "--i": 0 }}>
          <img src="/pravideon-logo.png" alt="Expa AI logo" className="landing-logo landing-anim landing-anim--soft-pop" style={{ "--i": 1 }} />
          <span className="landing-anim landing-anim--fade" style={{ "--i": 2 }}>Expa AI</span>
        </div>
        <nav className="landing-actions">
          <Link href="/auth" className="landing-link landing-anim landing-anim--slide" style={{ "--i": 3 }}>Login</Link>
          <Link href="/dashboard" className="landing-cta landing-cta--ghost landing-anim landing-anim--slide" style={{ "--i": 4 }}>Open Dashboard</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <p className="landing-kicker landing-anim landing-anim--soft-pop" style={{ "--i": 5 }}>Strategic Business Intelligence</p>
        <h1 className="landing-anim landing-anim--fade" style={{ "--i": 6 }}>
          Build, test, and scale startup ideas with
          <span className="landing-anim landing-anim--glow" style={{ "--i": 7 }}> animated decision clarity</span>
        </h1>
        <p className="landing-sub landing-anim landing-anim--fade" style={{ "--i": 8 }}>
          Expa AI combines market scoring, financial modeling, competitive positioning, and investor-readiness workflows into a single interactive experience.
        </p>

        <div className="landing-hero-actions landing-anim landing-anim--slide" style={{ "--i": 9 }}>
          <Link href="/dashboard" className="landing-cta landing-anim landing-anim--soft-pop" style={{ "--i": 10 }}>Start Analyzing</Link>
          <Link href="/history" className="landing-link landing-anim landing-anim--soft-pop" style={{ "--i": 11 }}>View History</Link>
        </div>

        <div className="landing-stats">
          {stats.map((item, index) => (
            <article
              key={item.label}
              className="landing-anim landing-anim--slide"
              style={{ "--i": index + 12 }}
            >
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-marquee landing-anim landing-anim--fade" style={{ "--i": 16 }} aria-label="platform capabilities">
        <div>
          {marqueeItems.map((item, index) => (
            <span key={`${item}-${index}`} className="landing-anim landing-anim--fade" style={{ "--i": index + 17 }}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="landing-features">
        {highlights.map((item, index) => (
          <article
            key={item.title}
            className="landing-anim landing-anim--slide"
            style={{ "--i": index + 26 }}
          >
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="landing-ideology">
        <div className="landing-ideology-copy landing-anim landing-anim--slide" style={{ "--i": 35 }}>
          <p className="landing-kicker landing-anim landing-anim--soft-pop" style={{ "--i": 36 }}>Project Ideology</p>
          <h2 className="landing-anim landing-anim--fade" style={{ "--i": 37 }}>
            Designed for founders who need fast answers and strategic depth
          </h2>
          <p className="landing-ideology-sub landing-anim landing-anim--fade" style={{ "--i": 38 }}>
            Our interface language mirrors the product philosophy: signal-forward, execution-driven, and investor-literate. Every visual element translates complexity into usable momentum.
          </p>

          <div className="landing-pillars">
            {ideologyPillars.map((pillar, index) => (
              <article
                key={pillar.title}
                className="landing-pillar landing-anim landing-anim--slide"
                style={{ "--i": index + 39 }}
              >
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="landing-ideology-visual landing-anim landing-anim--soft-pop" style={{ "--i": 43 }}>
          <div className="ideology-stage">
            <div className="ideology-core landing-anim landing-anim--glow" style={{ "--i": 44 }} />
            <div className="ideology-ring ideology-ring--one" />
            <div className="ideology-ring ideology-ring--two" />
            <div className="ideology-ring ideology-ring--three" />

            <svg viewBox="0 0 520 360" className="ideology-lines" aria-hidden="true">
              <path d="M42 278 C130 208, 168 146, 256 172 C336 196, 384 98, 488 116" />
              <path d="M40 210 C122 194, 180 236, 272 228 C364 220, 416 170, 492 190" />
              <path d="M36 142 C102 88, 206 88, 294 126 C372 160, 424 138, 486 86" />
            </svg>

            <div className="ideology-dots" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, index) => (
                <span
                  key={`dot-${index}`}
                  style={{
                    "--angle": `${index * 20}deg`,
                    "--radius": `${80 + (index % 3) * 26}px`,
                    "--i": `${index + 45}`,
                  }}
                  className="landing-anim landing-anim--soft-pop"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-signal-board">
        {signalNodes.map((node, index) => (
          <article
            key={node.title}
            className="signal-tile landing-anim landing-anim--slide"
            style={{ "--i": index + 64 }}
          >
            <h3>{node.title}</h3>
            <div className="signal-meter">
              <span style={{ width: `${node.value}%` }} />
            </div>
            <p>{node.value}% confidence alignment</p>
          </article>
        ))}
      </section>

      <section className="landing-growth-vectors" aria-label="business growth vectors">
        <article className="growth-vector-card landing-anim landing-anim--slide" style={{ "--i": 80 }}>
          <svg viewBox="0 0 420 220" className="growth-svg growth-svg--funnel" aria-hidden="true">
            <polygon points="30,25 390,25 320,90 100,90" className="gv-surface" />
            <polygon points="100,100 320,100 270,150 150,150" className="gv-surface gv-surface--mid" />
            <polygon points="150,160 270,160 230,198 190,198" className="gv-surface gv-surface--end" />
            <path d="M205 198 L205 214" className="gv-stream" />
            <circle cx="205" cy="214" r="5" className="gv-node" />
            <circle cx="90" cy="58" r="4" className="gv-dot" />
            <circle cx="165" cy="58" r="4" className="gv-dot" />
            <circle cx="240" cy="58" r="4" className="gv-dot" />
            <circle cx="315" cy="58" r="4" className="gv-dot" />
          </svg>
        </article>

        <article className="growth-vector-card landing-anim landing-anim--slide" style={{ "--i": 81 }}>
          <svg viewBox="0 0 420 220" className="growth-svg growth-svg--network" aria-hidden="true">
            <path d="M54 170 C104 100, 178 100, 210 44" className="gv-link" />
            <path d="M210 44 C260 102, 320 106, 366 170" className="gv-link" />
            <path d="M54 170 C148 188, 272 188, 366 170" className="gv-link gv-link--soft" />
            <circle cx="54" cy="170" r="12" className="gv-node" />
            <circle cx="210" cy="44" r="12" className="gv-node" />
            <circle cx="366" cy="170" r="12" className="gv-node" />
            <circle cx="210" cy="112" r="8" className="gv-node gv-node--mid" />
            <circle cx="132" cy="124" r="6" className="gv-dot" />
            <circle cx="286" cy="124" r="6" className="gv-dot" />
          </svg>
        </article>

        <article className="growth-vector-card landing-anim landing-anim--slide" style={{ "--i": 82 }}>
          <svg viewBox="0 0 420 220" className="growth-svg growth-svg--kpi" aria-hidden="true">
            <line x1="28" y1="188" x2="392" y2="188" className="gv-axis" />
            <rect x="70" y="146" width="34" height="42" className="gv-bar" />
            <rect x="144" y="120" width="34" height="68" className="gv-bar" />
            <rect x="218" y="90" width="34" height="98" className="gv-bar" />
            <rect x="292" y="54" width="34" height="134" className="gv-bar" />
            <path d="M54 170 C98 154, 126 140, 160 126 C198 110, 236 90, 274 66 C304 50, 334 40, 368 30" className="gv-trend" />
            <circle cx="368" cy="30" r="7" className="gv-node" />
          </svg>
        </article>
      </section>

      <section className="landing-panel landing-anim landing-anim--soft-pop" style={{ "--i": 30 }}>
        <div className="landing-panel-copy landing-anim landing-anim--fade" style={{ "--i": 31 }}>
          <h3 className="landing-anim landing-anim--fade" style={{ "--i": 32 }}>From idea to execution in one run</h3>
          <p className="landing-anim landing-anim--fade" style={{ "--i": 33 }}>
            Launch an analysis, unlock advanced tabs, then export clean investor artifacts. The flow is designed for founders who need velocity without losing strategic depth.
          </p>
        </div>
        <Link href="/dashboard" className="landing-cta landing-anim landing-anim--soft-pop" style={{ "--i": 34 }}>Launch Workspace</Link>
      </section>
    </main>
  );
}
