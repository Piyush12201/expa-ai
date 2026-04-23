import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function SWOTandPositioning({ swot, positioning, loading }) {
  if (loading) {
    return (
      <article className="card">
        <div className="section-head">
          <span>SWOT & Positioning</span>
          <span>Loading...</span>
        </div>
      </article>
    );
  }

  if (!swot || !positioning) return null;

  const positioningData = [
    ...positioning.competitors.map((c) => ({
      x: c.maturity || 5,
      y: c.differentiation || 5,
      name: c.name,
      type: "competitor",
    })),
    {
      x: positioning.marketMaturity,
      y: positioning.differentiation,
      name: "Your Position",
      type: "yours",
    },
  ];

  const quadrantLabels = {
    established: { x: 7, y: 3, label: "Established (Low Innovation, Mature Market)" },
    innovator: { x: 7, y: 7, label: "Innovator (High Innovation, Mature Market)" },
    niche: { x: 3, y: 3, label: "Niche Player (Low Innovation, Emerging Market)" },
    disruption: { x: 3, y: 7, label: "Disruptor (High Innovation, Emerging Market)" },
  };

  return (
    <div className="swot-section">
      <article className="card positioning-map">
        <div className="section-head">
          <span>Market Positioning Map</span>
          <span className="quadrant-label">{positioning.quadrant}</span>
        </div>

        <div className="chart-wrap" style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(171, 199, 255, 0.16)" />
              <XAxis type="number" dataKey="x" domain={[0, 10]} label={{ value: "Market Maturity (Established →)", position: "bottom" }} tick={{ fill: "#d4e4ff", fontSize: 11 }} />
              <YAxis type="number" dataKey="y" domain={[0, 10]} label={{ value: "Differentiation →", angle: -90, position: "insideLeft" }} tick={{ fill: "#a9bfdd", fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => active && payload?.[0]?.payload && (
                <div style={{ backgroundColor: "#1a2847", padding: "8px 12px", border: "1px solid #7c5cff", borderRadius: 4 }}>
                  <p style={{ color: "#fff", margin: 0 }}>{payload[0].payload.name}</p>
                </div>
              )} />
              <Scatter name="Competition" data={positioningData.filter((d) => d.type === "competitor")} fill="#ff8f6b" shape="circle" />
              <Scatter name="Your Position" data={positioningData.filter((d) => d.type === "yours")} fill="#2cd4a7" shape="diamond" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <p className="positioning-description">{positioning.description}</p>
        {positioning.statement && <p className="positioning-statement"><strong>Position:</strong> {positioning.statement}</p>}
      </article>

      <div className="swot-grid">
        <article className="card swot-card strengths">
          <h3>💪 Strengths</h3>
          <ul>
            {swot.strengths.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="card swot-card weaknesses">
          <h3>⚠️ Weaknesses</h3>
          <ul>
            {swot.weaknesses.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="card swot-card opportunities">
          <h3>📈 Opportunities</h3>
          <ul>
            {swot.opportunities.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="card swot-card threats">
          <h3>🚨 Threats</h3>
          <ul>
            {swot.threats.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
