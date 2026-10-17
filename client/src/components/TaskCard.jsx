import { memo } from "react";

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

const TaskCard = memo(function TaskCard({
  task,
  canManage,
  onDetails,
  onEdit,
  onDelete,
}) {
  return (
    <article className="task-row task-row-card">
      <div className="task-symbol" aria-hidden="true">✓</div>
      <div className="task-details">
        <h3>{task.title}</h3>
        <p>{task.description || "No description provided"}</p>
        <small>
          Due: {formatDate(task.dueDate)} · Created by: {task.createdBy?.name || "Unknown"} ·
          {" "}Assigned to: {task.assignedTo?.name || "Unassigned"}
        </small>
      </div>
      <div className="task-meta">
        <span className={`priority priority-${task.priority?.toLowerCase()}`}>
          {task.priority}
        </span>
        <span className={`status status-${task.status?.toLowerCase().replace(/\s+/g, "-")}`}>
          {task.status}
        </span>
      </div>
      <div className="task-actions">
        <button type="button" className="secondary-button" onClick={() => onDetails(task)}>
          Details
        </button>
        {canManage && (
          <>
            <button type="button" className="secondary-button" onClick={() => onEdit(task)}>
              Edit
            </button>
            <button type="button" className="danger-button" onClick={() => onDelete(task)}>
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
});

export default TaskCard;
