import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setIsSubmitting(true);
      const response = await api.post("/auth/login", { email, password });
      onLoginSuccess(response.data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid login credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome Back</h1>
        <p className="muted">Login to manage your team tasks.</p>
        {error && <p className="error">{error}</p>}

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          required
        />

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <p className="auth-switch">
          No account? <Link to="/signup">Create one</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
