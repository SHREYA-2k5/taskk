import { memo, useMemo, useState } from "react";

const formatDate = (value) => {
  if (!value) return "No due date";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "No due date"
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const DashboardTask = memo(function DashboardTask({ task }) {
  return (
    <article className="task-row">
      <div className="task-symbol" aria-hidden="true">✓</div>
      <div className="task-details">
        <h3>{task.title}</h3>
        <p>{task.description || "No description provided"}</p>
      </div>
      <span className={`priority priority-${task.priority?.toLowerCase()}`}>
        {task.priority}
      </span>
      <span className={`status status-${task.status?.toLowerCase().replace(/\s+/g, "-")}`}>
        {task.status}
      </span>
    </article>
  );
});

function DashboardPage({ tasks, loading, error, onRetry }) {
  const [now] = useState(() => Date.now());
  const total = tasks.length;
  const statusCounts = useMemo(
    () => ({
      Pending: tasks.filter((task) => task.status === "Pending").length,
      "In Progress": tasks.filter((task) => task.status === "In Progress").length,
      Completed: tasks.filter((task) => task.status === "Completed").length,
    }),
    [tasks]
  );

  const today = useMemo(() => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [now]);
  const upcomingTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => {
        if (!task.dueDate || task.status === "Completed") return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today;
      })
      .sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate))
      .slice(0, 4);
  }, [tasks, today]);
  const upcomingCount = tasks.filter((task) => {
    if (!task.dueDate || task.status === "Completed") return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= today;
  }).length;
  const overdueCount = tasks.filter(
    (task) => {
      if (!task.dueDate || task.status === "Completed") return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }
  ).length;

  return (
    <>
      <section className="welcome-section">
        <div>
          <p className="eyebrow">YOUR PRODUCTIVITY SPACE</p>
          <h2>Get things done.</h2>
          <p>Organize your work and keep your team moving forward.</p>
        </div>
        <div className="welcome-icon" aria-hidden="true">✦</div>
      </section>

      <section className="stats-grid" aria-label="Task summary">
        <StatCard label="Total Tasks" value={loading || error ? "—" : total} note="All your tasks" />
        <StatCard label="Pending" value={loading || error ? "—" : statusCounts.Pending} note="Waiting to start" />
        <StatCard label="In Progress" value={loading || error ? "—" : statusCounts["In Progress"]} note="Work underway" />
        <StatCard label="Completed" value={loading || error ? "—" : statusCounts.Completed} note="Tasks finished" />
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="section-heading">
            <div>
              <h2>Recent Tasks</h2>
              <p>Your latest work and priorities</p>
            </div>
            <span className="task-count">{loading || error ? "—" : total} tasks</span>
          </div>

          {loading ? (
            <div className="message-state" role="status">Loading your tasks…</div>
          ) : error ? (
            <div className="message-state error-state" role="alert">
              <p>{error}</p>
              <button type="button" className="secondary-button" onClick={onRetry}>
                Try again
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="message-state">
              <div className="empty-icon" aria-hidden="true">✓</div>
              <h3>No tasks yet</h3>
              <p>Your tasks will appear here once you create them.</p>
            </div>
          ) : (
            <div className="task-list compact">
              {tasks.slice(0, 5).map((task) => (
                <DashboardTask key={task._id} task={task} />
              ))}
            </div>
          )}
        </article>

        <article className="panel-card">
          <div className="section-heading">
            <div>
              <h2>Task distribution</h2>
              <p>Progress across your workspace</p>
            </div>
          </div>
          <div className="chart-list" role="img" aria-label="Task counts by status">
            {loading ? (
              <p className="message-state small">Loading task data…</p>
            ) : error ? (
              <p className="message-state small">Task data unavailable.</p>
            ) : Object.entries(statusCounts).map(([status, count]) => (
              <div className="chart-row" key={status}>
                <div className="chart-label">
                  <span>{status}</span>
                  <strong>{count}</strong>
                </div>
                <div className="chart-track">
                  <span
                    className={`chart-bar chart-${status.toLowerCase().replace(/\s+/g, "-")}`}
                    style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mini-list">
            <div className="mini-stat">
              <span>Upcoming deadlines</span>
              <strong>{loading || error ? "—" : upcomingCount}</strong>
            </div>
            <div className="mini-stat danger">
              <span>Overdue</span>
              <strong>{loading || error ? "—" : overdueCount}</strong>
            </div>
          </div>
          {loading || error ? (
            <div className="message-state small">
              {loading ? "Loading deadlines…" : "Deadline data unavailable."}
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div className="message-state small">No upcoming deadlines.</div>
          ) : (
            <ul className="deadline-list">
              {upcomingTasks.map((task) => (
                <li key={task._id}>
                  <strong>{task.title}</strong>
                  <span>{formatDate(task.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </>
  );
}

const StatCard = memo(function StatCard({ label, value, note }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <h2>{value}</h2>
      <span>{note}</span>
    </article>
  );
});

export default DashboardPage;
