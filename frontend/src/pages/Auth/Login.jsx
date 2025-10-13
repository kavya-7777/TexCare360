// frontend/src/pages/Auth/Login.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setSubmitting(true);
  try {
    await login(email, password);
    setSubmitting(false);
    navigate("/dashboard");
  } catch (err) {
    setSubmitting(false);
    setError(
      err.response?.data?.message ||
      err.message ||
      "Login failed."
    );
  }
};

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="card p-4" style={{ width: 420 }}>
        <h3 className="card-title mb-3">TexCare360 - Login</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              required
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              required
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          <div className="d-grid">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <div className="mt-3 text-center">
          <small>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </small>
        </div>
      </div>
    </div>
  );
}
