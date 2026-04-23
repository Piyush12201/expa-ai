import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function FinancialDashboard({ reportId, financials, loading }) {
  const [activeYear, setActiveYear] = useState(1);

  if (loading) {
    return (
      <article className="card">
        <div className="section-head">
          <span>Financial Projections</span>
          <span>Loading...</span>
        </div>
      </article>
    );
  }

  if (!financials) return null;

  const chartData = [
    { year: "Year 1", revenue: financials.year1Revenue, costs: financials.year1Costs },
    { year: "Year 2", revenue: financials.year2Revenue, costs: financials.year2Costs },
    { year: "Year 3", revenue: financials.year3Revenue, costs: financials.year3Costs },
    { year: "Year 4", revenue: financials.year4Revenue, costs: financials.year4Costs },
    { year: "Year 5", revenue: financials.year5Revenue, costs: financials.year5Costs },
  ];

  const years = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];

  return (
    <div className="financial-section">
      <article className="card financial-overview">
        <div className="section-head">
          <span>5-Year Financial Projection</span>
          <span>Revenue vs. Costs</span>
        </div>

        <div className="chart-wrap" style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(171, 199, 255, 0.16)" />
              <XAxis dataKey="year" tick={{ fill: "#d4e4ff", fontSize: 12 }} />
              <YAxis tick={{ fill: "#a9bfdd", fontSize: 11 }} formatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} contentStyle={{ backgroundColor: "#1a2847", border: "1px solid #7c5cff" }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#2cd4a7" strokeWidth={3} name="Revenue" dot={{ r: 5 }} />
              <Line type="monotone" dataKey="costs" stroke="#ff8f6b" strokeWidth={3} name="Operating Costs" dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="financial-grid">
          <div className="financial-card">
            <p>Breakeven Month</p>
            <strong className="metric-value">Month {financials.breakevenMonth}</strong>
            <span className="metric-sub">{Math.round(financials.breakevenMonth / 12)} years to profitability</span>
          </div>
          <div className="financial-card">
            <p>5-Year Revenue</p>
            <strong className="metric-value">${(financials.year5Revenue / 1000000).toFixed(1)}M</strong>
            <span className="metric-sub">Cumulative</span>
          </div>
          <div className="financial-card">
            <p>Implied Valuation</p>
            <strong className="metric-value">${(financials.impliedValuation / 1000000).toFixed(1)}M</strong>
            <span className="metric-sub">At Year 5 run rate</span>
          </div>
          <div className="financial-card">
            <p>ROI %</p>
            <strong className="metric-value">{financials.roisPercentage}%</strong>
            <span className="metric-sub">On initial investment</span>
          </div>
        </div>
      </article>

      <article className="card year-breakdown">
        <div className="section-head">
          <span>Year-by-Year Breakdown</span>
          <span>Select a year to compare</span>
        </div>
        <div className="year-selector">
          {years.map((year, idx) => (
            <button
              key={year}
              className={`year-btn ${activeYear === idx + 1 ? "active" : ""}`}
              onClick={() => setActiveYear(idx + 1)}
            >
              {year}
            </button>
          ))}
        </div>

        {activeYear <= 5 && (
          <div className="year-detail">
            <div className="detail-row">
              <span>Revenue</span>
              <strong>${chartData[activeYear - 1].revenue.toLocaleString()}</strong>
            </div>
            <div className="detail-row">
              <span>Operating Costs</span>
              <strong>${chartData[activeYear - 1].costs.toLocaleString()}</strong>
            </div>
            <div className="detail-row highlight">
              <span>Net Income (Gross)</span>
              <strong>${(chartData[activeYear - 1].revenue - chartData[activeYear - 1].costs).toLocaleString()}</strong>
            </div>
            <div className="detail-row">
              <span>Margin %</span>
              <strong>{Math.round(((chartData[activeYear - 1].revenue - chartData[activeYear - 1].costs) / chartData[activeYear - 1].revenue) * 100)}%</strong>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
