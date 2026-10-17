import { memo, useMemo } from "react";

const TeamMemberCard = memo(function TeamMemberCard({ user, tasks }) {
  const assignedTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const assignee = task.assignedTo?._id || task.assignedTo;
        return assignee === user._id;
      }),
    [tasks, user._id]
  );

  return (
    <article className="team-card">
      <div className="team-avatar" aria-hidden="true">
        {(user.name || "U").charAt(0).toUpperCase()}
      </div>
      <div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
      <span className="task-count">{assignedTasks.length} assigned</span>
      {assignedTasks.length === 0 ? (
        <small>No tasks assigned.</small>
      ) : (
        <ul className="team-task-list">
          {assignedTasks.slice(0, 3).map((task) => (
            <li key={task._id}>{task.title}</li>
          ))}
        </ul>
      )}
    </article>
  );
});

function TeamPage({ users, tasks, loading, error, onRetry }) {
  return (
    <section className="panel-card">
      <div className="section-heading compact-heading">
        <div>
          <h2>Team</h2>
          <p>Registered TaskFlow members</p>
        </div>
        <span className="task-count">{users.length} members</span>
      </div>
      {loading ? (
        <div className="message-state" role="status">Loading team members…</div>
      ) : error ? (
        <div className="message-state error-state" role="alert">
          <p>{error}</p>
          <button type="button" className="secondary-button" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="message-state">No team members found.</div>
      ) : (
        <div className="team-grid">
          {users.map((user) => (
            <TeamMemberCard key={user._id} user={user} tasks={tasks} />
          ))}
        </div>
      )}
    </section>
  );
}

export default TeamPage;
