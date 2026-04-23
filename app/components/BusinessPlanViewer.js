import { useState } from "react";

export function BusinessPlanViewer({ reportId, businessPlan, loading }) {
  const [activeSection, setActiveSection] = useState("executive");

  if (loading) {
    return (
      <article className="card">
        <div className="section-head">
          <span>Business Plan</span>
          <span>Generating...</span>
        </div>
      </article>
    );
  }

  if (!businessPlan) {
    return (
      <article className="card">
        <div className="section-head">
          <span>Business Plan</span>
          <span>Not yet generated</span>
        </div>
        <p className="empty-state">Run advanced analysis to generate your comprehensive business plan.</p>
      </article>
    );
  }

  const sections = [
    { id: "executive", label: "Executive Summary", title: "Executive Summary" },
    { id: "market", label: "Market Analysis", title: "Market Analysis" },
    { id: "strategy", label: "Strategy", title: "Marketing & Competitive Strategy" },
    { id: "financial", label: "Financial", title: "Financial Projections" },
    { id: "implementation", label: "Implementation", title: "Implementation Roadmap" },
  ];

  const getSectionContent = () => {
    const sectionKeyMap = {
      executive: ["executiveSummary", "section1_Executive"],
      market: ["marketAnalysis", "section2_Market"],
      strategy: ["marketingStrategy", "section3_Strategy"],
      financial: ["financialProjections", "section4_Financial"],
      implementation: ["implementationTimeline", "section5_Implementation"],
    };

    const keys = sectionKeyMap[activeSection] || [];
    for (const key of keys) {
      const fromSections = businessPlan.sections?.[key];
      if (fromSections) return fromSections;

      const fromRoot = businessPlan[key];
      if (fromRoot) return fromRoot;
    }

    return "";
  };

  const handleDownload = async (format) => {
    const url = `/api/advanced/businessplan/${reportId}?format=${format}`;
    const link = document.createElement("a");
    link.href = url;
    link.click();
  };

  return (
    <article className="card business-plan-card">
      <div className="section-head">
        <span>{businessPlan.title}</span>
        <div className="export-buttons">
          <button className="btn-secondary" onClick={() => handleDownload("text")}>
            📄 Download TXT
          </button>
          <button className="btn-secondary" onClick={() => handleDownload("pdf")}>
            📕 Download PDF
          </button>
        </div>
      </div>

      <div className="plan-sections">
        <div className="section-tabs">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`section-tab ${activeSection === section.id ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="section-content">
          <h2>{sections.find((s) => s.id === activeSection)?.title}</h2>
          <div className="plan-text">
            {getSectionContent().split("\n").map((paragraph, idx) => (
              paragraph.trim() && (
                <p key={idx}>{paragraph}</p>
              )
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
