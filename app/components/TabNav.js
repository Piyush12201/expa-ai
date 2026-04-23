export function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="tab-nav">
      <div className="tab-nav__items">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-nav__item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.badge && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
