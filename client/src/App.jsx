import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import api from "./services/api";
import { logoutUser } from "./services/authService";
import { useAuth } from "./hooks/useAuth";
import { useToast } from "./hooks/useToast";
import { getAuthToken } from "./utils/authStorage";
import Auth from "./Auth";
import "./App.css";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));

function App() {
  const { user: currentUser, signIn, signOut } = useAuth();
  const { notify } = useToast();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(currentUser));
  const [usersLoading, setUsersLoading] = useState(() => Boolean(currentUser));
  const [error, setError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("taskflow-theme") || "light"
  );

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.get("/api/tasks");
      setTasks(response.data.tasks || []);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        return;
      }
      setError(
        requestError.response?.data?.message ||
          "Unable to load tasks. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/api/users");
      setUsers(response.data.users || []);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        return;
      }
      setUsersError(
        requestError.response?.data?.message ||
          "Unable to load team members. Check your connection and try again."
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const reloadTasks = useCallback(() => {
    setLoading(true);
    setError("");
    return fetchTasks();
  }, [fetchTasks]);

  const reloadUsers = useCallback(() => {
    setUsersLoading(true);
    setUsersError("");
    return fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      fetchTasks();
      fetchUsers();
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser, fetchTasks, fetchUsers]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logoutUser();
      signOut();
      setTasks([]);
      setUsers([]);
      notify("Your session expired. Please sign in again.", "error");
    };

    window.addEventListener("taskflow:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("taskflow:unauthorized", handleUnauthorized);
  }, [notify, signOut]);

  const handleLogin = (authenticatedUser) => {
    setLoading(true);
    setUsersLoading(true);
    setError("");
    setUsersError("");
    signIn(authenticatedUser);
  };

  const handleLogout = () => {
    logoutUser();
    signOut();
    setTasks([]);
    setUsers([]);
    setError("");
    setUsersError("");
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("taskflow-theme", next);
    setTheme(next);
  };

  if (!currentUser || !getAuthToken()) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout" data-theme={theme}>
      <aside className="sidebar">
        <h2 className="brand">
          TaskFlow<span>.</span>
        </h2>

        <p className="sidebar-label">WORKSPACE</p>
        <nav className="navigation" aria-label="Main navigation">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <span aria-hidden="true">▦</span> Dashboard
          </NavLink>
          <NavLink
            to="/tasks"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <span aria-hidden="true">✓</span> My Tasks
          </NavLink>
          <NavLink
            to="/team"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <span aria-hidden="true">♧</span> Team
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <p>Stay organized.</p>
          <span>One task at a time.</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">WORKSPACE / OVERVIEW</p>
            <h1>TaskFlow</h1>
          </div>
          <div className="profile">
            <div className="avatar" aria-hidden="true">
              {(currentUser.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="profile-copy">
              <strong>{currentUser.name}</strong>
              <p>{currentUser.email}</p>
            </div>
            <button
              type="button"
              className="secondary-button theme-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button type="button" className="logout-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <Suspense fallback={<div className="message-state" role="status">Loading page…</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  tasks={tasks}
                  loading={loading}
                  error={error}
                  onRetry={reloadTasks}
                />
              }
            />
            <Route
              path="/tasks"
              element={
                <TasksPage
                  tasks={tasks}
                  users={users}
                  currentUser={currentUser}
                  loading={loading}
                  error={error}
                  onRetry={reloadTasks}
                  refreshTasks={reloadTasks}
                  notify={notify}
                />
              }
            />
            <Route
              path="/team"
              element={
                <TeamPage
                  tasks={tasks}
                  users={users}
                  loading={usersLoading}
                  error={usersError}
                  onRetry={reloadUsers}
                />
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
