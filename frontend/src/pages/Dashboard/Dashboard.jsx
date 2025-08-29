import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import "./Dashboard.css";

function Dashboard() {
  // Mock data for now (later from backend/ML)
  const machines = { healthy: 12, unhealthy: 3 };
  const technicians = { available: 5, busy: 2 };
  const inventory = { lowStock: 4, total: 20 };

  return (
    <div className="dashboard">
      <h2 className="mb-4">Dashboard Overview</h2>

      <Row>
        {/* Machine Health Card */}
        <Col md={4}>
          <Card className="dashboard-card">
            <Card.Body>
              <Card.Title>Machine Health</Card.Title>
              <Card.Text>
                ✅ Healthy: {machines.healthy} <br />
                ⚠️ Unhealthy: {machines.unhealthy}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Technician Status Card */}
        <Col md={4}>
          <Card className="dashboard-card">
            <Card.Body>
              <Card.Title>Technicians</Card.Title>
              <Card.Text>
                🟢 Available: {technicians.available} <br />
                🔴 Busy: {technicians.busy}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Inventory Alerts Card */}
        <Col md={4}>
          <Card className="dashboard-card">
            <Card.Body>
              <Card.Title>Inventory</Card.Title>
              <Card.Text>
                📦 Total Items: {inventory.total} <br />
                ⚠️ Low Stock: {inventory.lowStock}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
