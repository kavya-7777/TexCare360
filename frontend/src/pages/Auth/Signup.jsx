// frontend/src/pages/Auth/Signup.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const ROLES = ["Admin", "Technician", "Manager"];

export default function Signup() {
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Technician");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);

  if (!ROLES.includes(role)) {
    setError("Invalid role selected.");
    return;
  }

  setSubmitting(true);
  try {
    await signup({ name, email, password, role });
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
      navigate("/login");
    }, 1500); // 1.5 seconds before redirect
  } catch (err) {
    setSubmitting(false);
    setError(
      err.response?.data?.message ||
      err.message ||
      "Signup failed."
    );
  }
};

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="card p-4" style={{ width: 480 }}>
        <h3 className="card-title mb-3">Create an account</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        {success && (
            <div className="alert alert-success">
                Account created successfully! Redirecting to login...
            </div>
        )}
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input required className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input required type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input required type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="d-grid">
            <button className="btn btn-success" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Sign up"}
            </button>
          </div>
        </form>

        <div className="mt-3 text-center">
          <small>
            Already have an account? <Link to="/login">Login</Link>
          </small>
        </div>
      </div>
    </div>
  );
}
