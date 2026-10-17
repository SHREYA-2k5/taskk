 
import { useState } from "react";
import { loginUser, registerUser } from "./services/authService";
import "./Auth.css";

function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let data;

      if (isRegister) {
        data = await registerUser({ name, email, password });
      } else {
        data = await loginUser({ email, password }, rememberMe);
      }

      onLogin(data.user);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request
            ? "Can't connect to TaskFlow. Check that the backend is running, then try again."
            : err.message || "Unable to submit your request. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-brand">TaskFlow<span>.</span></h1>
        <p className="auth-eyebrow">YOUR PRODUCTIVITY SPACE</p>

        <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
        <p className="auth-subtitle">
          {isRegister
            ? "Start organizing your work and your team."
            : "Log in to continue managing your tasks."}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              minLength={8}
              required
            />
          </label>

          {!isRegister && (
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember me on this device</span>
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to TaskFlow?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister ? "Log in" : "Create account"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default Auth;
