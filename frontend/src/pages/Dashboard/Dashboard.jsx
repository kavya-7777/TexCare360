// frontend/src/pages/Dashboard/Dashboard.jsx
import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Dashboard() {
  const { user, loading, logout } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border" role="status" aria-hidden="true"></div>
      </div>
    );
  }

  const renderAdmin = () => (
    <div>
      <h4>Admin Panel</h4>
      <div className="mb-3">
        <button className="btn btn-primary me-2">Add Machine</button>
        <button className="btn btn-secondary me-2">Manage Technicians</button>
        <button className="btn btn-secondary">Manage Inventory</button>
      </div>
      <p>This area is a placeholder for admin functionality (add / edit / delete machines, manage users, inventory).</p>
    </div>
  );

  const renderTechnician = () => (
    <div>
      <h4>Technician Tasks</h4>
      <div className="list-group mb-3">
        <div className="list-group-item">
          <div className="d-flex justify-content-between">
            <div>
              <strong>Task:</strong> Inspect Loom Machine 2
              <div className="text-muted small">Due: 2025-08-31</div>
            </div>
            <div>
              <button className="btn btn-success btn-sm">Mark task complete</button>
            </div>
          </div>
        </div>
      </div>
      <p>Technician placeholders — real task list can be wired to maintenance_logs endpoints.</p>
    </div>
  );

  const renderManager = () => (
    <div>
      <h4>Manager Dashboard</h4>
      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card p-3">
            <h6>Machine Health</h6>
            <p>Healthy: 3 &nbsp; Unhealthy: 1</p>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card p-3">
            <h6>Inventory Summary</h6>
            <p>Low stock items: 2</p>
          </div>
        </div>
      </div>
      <p>Manager placeholders for monitoring and inventory insights.</p>
    </div>
  );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Welcome, {user.name}</h2>
          <div className="text-muted">Role: {user.role}</div>
        </div>
        <div>
          <button className="btn btn-outline-danger" onClick={() => logout()}>
            Logout
          </button>
        </div>
      </div>

      <div className="card card-body">
        {user.role === "Admin" && renderAdmin()}
        {user.role === "Technician" && renderTechnician()}
        {user.role === "Manager" && renderManager()}
      </div>
    </div>
  );
}
