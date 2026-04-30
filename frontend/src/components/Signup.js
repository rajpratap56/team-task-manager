import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const Signup = ({ onSignupSuccess }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setIsSubmitting(true);
      const response = await api.post("/auth/signup", form);
      onSignupSuccess(response.data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p className="muted">Start managing projects and team tasks.</p>
        {error && <p className="error">{error}</p>}

        <label>Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Your name"
          required
        />

        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="you@example.com"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Min 6 characters"
          minLength={6}
          required
        />

        <label>Role</label>
        <select
          value={form.role}
          onChange={(event) => setForm({ ...form, role: event.target.value })}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Signup"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
