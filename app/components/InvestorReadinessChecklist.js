export function InvestorReadinessChecklist({ checklist, loading }) {
  if (loading) {
    return (
      <article className="card">
        <div className="section-head">
          <span>Investor Readiness</span>
          <span>Loading...</span>
        </div>
      </article>
    );
  }

  if (!checklist || !checklist.items) return null;

  const overallPercent = checklist.overallReadinessPercent || 0;
  const statusColor = overallPercent >= 80 ? "#2cd4a7" : overallPercent >= 60 ? "#ffd56b" : "#ff8f6b";
  const statusLabel = overallPercent >= 80 ? "Investor Ready" : overallPercent >= 60 ? "Near Ready" : "Needs Work";

  return (
    <div className="investor-section">
      <article className="card investor-overview">
        <div className="section-head">
          <span>Investor Readiness Checklist</span>
          <span style={{ color: statusColor }}>{statusLabel}</span>
        </div>

        <div className="readiness-display">
          <div className="readiness-gauge">
            <svg viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(171, 199, 255, 0.1)" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={statusColor}
                strokeWidth="8"
                strokeDasharray={`${(overallPercent / 100) * 314} 314`}
                strokeLinecap="round"
                style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
              />
              <text x="60" y="60" textAnchor="middle" dy="0.3em" fontSize="32" fontWeight="bold" fill={statusColor}>
                {overallPercent}%
              </text>
            </svg>
            <p>{statusLabel}</p>
          </div>

          <div className="readiness-notes">
            <h4>What You'll Need</h4>
            <ul>
              <li>Clear pitch and business model</li>
              <li>Market validation & traction</li>
              <li>Financial projections realistic</li>
              <li>Team depth and experience</li>
              <li>Legal structure in place</li>
            </ul>
          </div>
        </div>

        <div className="progress-bar investor-progress">
          <span style={{ width: `${overallPercent}%`, backgroundColor: statusColor }} />
        </div>
      </article>

      <div className="checklist-categories">
        {checklist.items.map((category, catIdx) => (
          <article key={catIdx} className="card checklist-category">
            <h3>{category.category}</h3>
            <div className="category-items">
              {category.items.map((item, itemIdx) => {
                const importance = item.importance || "important";
                return (
                  <div key={itemIdx} className={`checklist-item importance-${importance}`}>
                    <div className="item-checkbox">
                      <input type="checkbox" defaultChecked={false} />
                    </div>
                    <div className="item-content">
                      <p>{item.item}</p>
                      <span className={`importance-badge importance-${importance}`}>
                        {importance === "critical" ? "Critical" : "Important"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
