import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import TaskCard from "../components/TaskCard";

const emptyTaskForm = {
  title: "",
  description: "",
  priority: "Medium",
  status: "Pending",
  dueDate: "",
  assignedTo: "",
};
const statusOptions = ["Pending", "In Progress", "Completed"];
const priorityOptions = ["Low", "Medium", "High"];
const pageSize = 6;

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

const getTaskOwnerId = (task) => task.createdBy?._id || task.createdBy;

function TasksPage({
  tasks,
  users,
  currentUser,
  loading,
  error,
  onRetry,
  refreshTasks,
  notify,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("dueDate");
  const [page, setPage] = useState(1);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedTask) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedTask(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedTask]);

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...tasks]
      .filter((task) => {
        const matchesSearch =
          !term ||
          task.title.toLowerCase().includes(term) ||
          task.description?.toLowerCase().includes(term);
        const matchesStatus =
          statusFilter === "All" || task.status === statusFilter;
        const matchesPriority =
          priorityFilter === "All" || task.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === "createdAt") {
          return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        }
        const dateA = a.dueDate ? Date.parse(a.dueDate) : Infinity;
        const dateB = b.dueDate ? Date.parse(b.dueDate) : Infinity;
        return dateA - dateB;
      });
  }, [tasks, search, statusFilter, priorityFilter, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageTasks = filteredTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleTaskChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setTaskForm(emptyTaskForm);
    setEditingTaskId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const title = taskForm.title.trim();
    if (!title) {
      notify("Task title is required.", "error");
      return;
    }

    const payload = {
      ...taskForm,
      title,
      description: taskForm.description.trim(),
      assignedTo: taskForm.assignedTo || (editingTaskId ? "" : undefined),
      dueDate: taskForm.dueDate || (editingTaskId ? "" : undefined),
    };

    setSaving(true);
    try {
      if (editingTaskId) {
        await api.put(`/api/tasks/${editingTaskId}`, payload);
        notify("Task updated.");
      } else {
        await api.post("/api/tasks", payload);
        notify("Task created.");
      }
      resetForm();
      setPage(1);
      await refreshTasks();
    } catch (error) {
      if (error.response?.status === 401) return;
      notify(
        error.response?.data?.message ||
          "Could not save the task. Check your connection and try again.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = useCallback((task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "Medium",
      status: task.status || "Pending",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDelete = useCallback(async (task) => {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/tasks/${task._id}`);
      notify("Task deleted.");
      await refreshTasks();
    } catch (error) {
      if (error.response?.status === 401) return;
      notify(
        error.response?.data?.message ||
          "Could not delete the task. Check your connection and try again.",
        "error"
      );
    }
  }, [notify, refreshTasks]);

  const handleDetails = useCallback(async (task) => {
    setDetailLoading(true);
    try {
      const response = await api.get(`/api/tasks/${task._id}`);
      setSelectedTask(response.data.task);
    } catch (error) {
      if (error.response?.status === 401) return;
      notify(
        error.response?.data?.message || "Could not load task details.",
        "error"
      );
    } finally {
      setDetailLoading(false);
    }
  }, [notify]);

  return (
    <div className="page-stack">
      <section className="panel-card task-form-panel">
        <div className="section-heading compact-heading">
          <div>
            <h2>{editingTaskId ? "Edit task" : "Create a task"}</h2>
            <p>{editingTaskId ? "Update your task details" : "Add work for your team"}</p>
          </div>
          {editingTaskId && (
            <button type="button" className="secondary-button" onClick={resetForm}>
              Cancel editing
            </button>
          )}
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <label>
              Title
              <input
                name="title"
                value={taskForm.title}
                onChange={handleTaskChange}
                placeholder="Task title"
                maxLength={120}
                required
              />
            </label>
            <label>
              Due date
              <input
                type="date"
                name="dueDate"
                value={taskForm.dueDate}
                onChange={handleTaskChange}
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              name="description"
              value={taskForm.description}
              onChange={handleTaskChange}
              rows="4"
              maxLength={2000}
              placeholder="Describe the task"
            />
          </label>

          <div className="field-row three-up">
            <label>
              Priority
              <select name="priority" value={taskForm.priority} onChange={handleTaskChange}>
                {priorityOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Status
              <select name="status" value={taskForm.status} onChange={handleTaskChange}>
                {statusOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Assigned user
              <select name="assignedTo" value={taskForm.assignedTo} onChange={handleTaskChange}>
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving…" : editingTaskId ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel-card">
        <div className="section-heading compact-heading">
          <div>
            <h2>My Tasks</h2>
            <p>Search, filter, and sort work you own or are assigned</p>
          </div>
          <span className="task-count">{filteredTasks.length} results</span>
        </div>

        <div className="toolbar">
          <label className="visually-hidden" htmlFor="task-search">Search tasks</label>
          <input
            id="task-search"
            type="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search title or description"
          />
          <label className="visually-hidden" htmlFor="task-status-filter">Filter by status</label>
          <select
            id="task-status-filter"
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
          >
            <option value="All">All statuses</option>
            {statusOptions.map((status) => <option key={status}>{status}</option>)}
          </select>
          <label className="visually-hidden" htmlFor="task-priority-filter">Filter by priority</label>
          <select
            id="task-priority-filter"
            value={priorityFilter}
            onChange={(event) => { setPriorityFilter(event.target.value); setPage(1); }}
          >
            <option value="All">All priorities</option>
            {priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}
          </select>
          <label className="visually-hidden" htmlFor="task-sort">Sort tasks</label>
          <select
            id="task-sort"
            value={sortBy}
            onChange={(event) => { setSortBy(event.target.value); setPage(1); }}
          >
            <option value="dueDate">Sort by due date</option>
            <option value="createdAt">Sort by created date</option>
          </select>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
              setPriorityFilter("All");
              setSortBy("dueDate");
              setPage(1);
            }}
          >
            Clear filters
          </button>
        </div>

        {loading ? (
          <div className="message-state" role="status">Loading tasks…</div>
        ) : error ? (
          <div className="message-state error-state" role="alert">
            <p>{error}</p>
            <button type="button" className="secondary-button" onClick={onRetry}>
              Try again
            </button>
          </div>
        ) : pageTasks.length === 0 ? (
          <div className="message-state">
            {tasks.length === 0 ? "No tasks yet. Create your first task above." : "No tasks match your filters."}
          </div>
        ) : (
          <div className="task-list">
            {pageTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                canManage={getTaskOwnerId(task) === currentUser.id}
                onDetails={handleDetails}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {filteredTasks.length > pageSize && (
          <nav className="pagination" aria-label="Task pages">
            <button
              type="button"
              className="secondary-button"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </button>
            <span>Page {currentPage} of {pageCount}</span>
            <button
              type="button"
              className="secondary-button"
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              Next
            </button>
          </nav>
        )}
      </section>

      {detailLoading && <div className="toast toast-info" role="status">Loading task details…</div>}
      {selectedTask && (
        <div className="modal-backdrop" onMouseDown={() => setSelectedTask(null)}>
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="section-heading compact-heading">
              <div>
                <h2 id="task-detail-title">{selectedTask.title}</h2>
                <p>Task details</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setSelectedTask(null)}>
                Close
              </button>
            </div>
            <div className="details-grid">
              <div><span>Status</span><strong>{selectedTask.status}</strong></div>
              <div><span>Priority</span><strong>{selectedTask.priority}</strong></div>
              <div><span>Due date</span><strong>{formatDate(selectedTask.dueDate)}</strong></div>
              <div><span>Created by</span><strong>{selectedTask.createdBy?.name || "Unknown"}</strong></div>
              <div><span>Assigned to</span><strong>{selectedTask.assignedTo?.name || "Unassigned"}</strong></div>
            </div>
            <p className="task-description">
              {selectedTask.description || "No description was provided for this task."}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

export default TasksPage;
