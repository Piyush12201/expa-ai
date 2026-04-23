import { useState } from "react";

export function ActionItemsTracker({ reportId, actions, onUpdateAction, onDeleteAction, loading }) {
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);

  if (loading) {
    return (
      <article className="card">
        <div className="section-head">
          <span>Action Items</span>
          <span>Loading...</span>
        </div>
      </article>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <article className="card">
        <div className="section-head">
          <span>Action Items & To-Do List</span>
          <span>Getting generated...</span>
        </div>
        <p className="empty-state">No action items yet. Run advanced analysis to generate next steps.</p>
      </article>
    );
  }

  const filtered = actions.filter((action) => {
    if (filter === "completed") return action.completed;
    if (filter === "pending") return !action.completed;
    if (filter === "high") return action.priority === "high" && !action.completed;
    return true;
  });

  const completedCount = actions.filter((a) => a.completed).length;
  const progressPercent = Math.round((completedCount / actions.length) * 100);

  const handleToggle = (action) => {
    onUpdateAction(action.id, { completed: !action.completed });
  };

  return (
    <article className="card action-items-card">
      <div className="section-head">
        <span>Action Items & To-Do List</span>
        <span>{completedCount}/{actions.length} completed</span>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="progress-text">{progressPercent}% Complete</p>
      </div>

      <div className="filter-tabs">
        <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          All ({actions.length})
        </button>
        <button className={`filter-btn ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>
          Pending ({actions.filter((a) => !a.completed).length})
        </button>
        <button className={`filter-btn ${filter === "completed" ? "active" : ""}`} onClick={() => setFilter("completed")}>
          Done ({completedCount})
        </button>
        <button className={`filter-btn ${filter === "high" ? "active" : ""}`} onClick={() => setFilter("high")}>
          Priority
        </button>
      </div>

      <div className="action-list">
        {filtered.length === 0 ? (
          <p className="empty-filter">No items in this filter</p>
        ) : (
          filtered.map((action) => (
            <div key={action.id} className={`action-item ${action.completed ? "completed" : ""} priority-${action.priority}`}>
              <div className="action-checkbox">
                <input
                  type="checkbox"
                  checked={action.completed}
                  onChange={() => handleToggle(action)}
                />
              </div>
              <div className="action-content">
                <h4>{action.title}</h4>
                <p>{action.description}</p>
                <div className="action-meta">
                  <span className={`priority-badge priority-${action.priority}`}>{action.priority}</span>
                  {action.dueDate && (
                    <span className="due-date">
                      Due: {new Date(action.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button className="delete-btn" onClick={() => onDeleteAction(action.id)}>×</button>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
