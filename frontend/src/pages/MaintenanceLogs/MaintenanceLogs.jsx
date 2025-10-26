// frontend/src/pages/MaintenanceLogs/MaintenanceLogs.jsx

import React, { useEffect, useState } from "react";
import { Table, Alert, Button, Badge, Modal, Form } from "react-bootstrap";
import axios from "axios";
import "./MaintenanceLogs.css";

function MaintenanceLogs({
  logs,
  setLogs,
  freeTechnician,
  inventory,
  setInventory,
  stockHistory,
  setStockHistory,
  machines,
  setMachines,
  currentUser,
}) {
  const [showAlert, setShowAlert] = useState(false);
  const [lowStockAlert, setLowStockAlert] = useState("");
  const [supplierAlert, setSupplierAlert] = useState("");
  const [errorAlert, setErrorAlert] = useState("");
  const [modalError, setModalError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedPart, setSelectedPart] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [logFilter, setLogFilter] = useState("All");

  // Fetch logs from backend
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/logs")
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Logs fetch error:", err));
  }, [setLogs]);

  // Success alert for new logs
  useEffect(() => {
    if (logs.length > 0) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [logs]);

  // Auto-hide error alert
  useEffect(() => {
    if (errorAlert) {
      const timer = setTimeout(() => setErrorAlert(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorAlert]);

  // Open modal to mark complete
  const handleCompleteClick = (log) => {
    setSelectedLog(log);
    setShowModal(true);
    setModalError("");
  };

  // Confirm completion & deduct inventory
  const handleCompleteConfirm = async () => {
    if (!selectedLog) return;

if (currentUser?.role === "Technician" && selectedLog.tech_id !== currentUser.id) {
  setModalError("⚠️ You are not allowed to complete this task.");
  return;
}

    let updatedPartUsage = "";

    try {
      if (selectedPart) {
        const selectedItem = inventory.find((i) => i.name === selectedPart);
        if (!selectedItem) return;

        if (quantity > selectedItem.quantity) {
          const msg = `❌ Invalid! You cannot use ${quantity} units. Only ${selectedItem.quantity} available.`;
          setModalError(msg);
          setErrorAlert(
            `⚠️ ${selectedLog.technician} tried to use ${quantity}x ${selectedItem.name}, but only ${selectedItem.quantity} left.`
          );
          return;
        }

        const newQty = Math.max(selectedItem.quantity - quantity, 0);

        if (newQty <= 5) {
          setLowStockAlert(
            `⚠️ Low Stock: ${selectedItem.name} has only ${newQty} left!`
          );
          setSupplierAlert(
            `👉 Order ${selectedItem.name} from ${
              selectedItem.supplier || "Supplier"
            } (Lead Time: ${selectedItem.lead_time || "N/A"} days)`
          );
        }

        // Update inventory locally
        setInventory((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id ? { ...item, quantity: newQty } : item
          )
        );

        // Add stock history locally
        setStockHistory((prev) => [
          ...prev,
          {
            action: "Used",
            item: selectedItem.name,
            qtyChange: `-${quantity}`,
            user: selectedLog.technician,
            date: new Date().toLocaleString(),
          },
        ]);

        updatedPartUsage = `${quantity} x ${selectedItem.name}`;

        // Update inventory in backend
        await axios.put(
          `http://localhost:5000/api/inventory/${selectedItem.id}`,
          { quantity: newQty }
        );

        // Add stock history in backend
        await axios.post(`http://localhost:5000/api/stock-history`, {
          action: "Used",
          item: selectedItem.name,
          qty_change: -quantity,
          user: selectedLog.technician,
        });
      }

      // Update log in backend
      await axios.put(`http://localhost:5000/api/logs/${selectedLog.id}`, {
        completed: 1,
        parts_used: updatedPartUsage,
      });

      // Update machine status in backend
await axios.put(`http://localhost:5000/api/machines/${selectedLog.machine_id}`, {
  status: "Healthy",
});

// Free technician in backend
await axios.post(`http://localhost:5000/api/machines/${selectedLog.machine_id}/unassign`, {
  techId: selectedLog.tech_id,
});

      // Update logs locally
      setLogs((prev) =>
        prev.map((log) =>
          log.id === selectedLog.id
            ? { ...log, completed: 1, parts_used: updatedPartUsage }
            : log
        )
      );

      // Update machine status
      setMachines((prev) =>
        prev.map((m) =>
          m.name === selectedLog.machine ? { ...m, status: "Healthy" } : m
        )
      );

      // Free technician
      if (freeTechnician) freeTechnician(selectedLog.tech_id);

      // Reset modal state
      setShowModal(false);
      setSelectedPart("");
      setQuantity(1);
      setModalError("");
    } catch (err) {
      console.error("Error completing log:", err);
      setModalError(
        "⚠️ Something went wrong while updating. Please try again."
      );
    }
  };

  return (
    <div className="logs-page">
      <h2 className="mb-4">Maintenance Logs</h2>

      {showAlert && <Alert variant="success">✅ New log added successfully!</Alert>}
      {lowStockAlert && <Alert variant="danger">{lowStockAlert}</Alert>}
      {supplierAlert && <Alert variant="warning">{supplierAlert}</Alert>}
      {errorAlert && <Alert variant="danger">{errorAlert}</Alert>}

      {/* Filter */}
      <Form.Select
        value={logFilter}
        onChange={(e) => setLogFilter(e.target.value)}
        className="mb-3"
        style={{ width: "250px" }}
      >
        <option value="All">All Logs</option>
        <option value="Completed">Completed Tasks</option>
        <option value="InProgress">In Progress</option>
      </Form.Select>

      {logs.length > 0 ? (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Machine</th>
              <th>Technician</th>
              <th>Skill</th>
              <th>Date & Time</th>
              <th>Parts Used</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {logs
              .filter((log) => {
                if (logFilter === "Completed") return log.completed;
                if (logFilter === "InProgress") return !log.completed;
                return true;
              })
              .map((log) => (
                <tr key={log.id}>
                  <td>{log.machine}</td>
                  <td>{log.technician}</td>
                  <td>{log.skill}</td>
                  <td>{new Date(log.date_time).toLocaleString()}</td>
                  <td>{log.parts_used || "—"}</td>
                  <td>
                    {log.completed ? (
                      <Badge bg="success">Completed</Badge>
                    ) : (
                      <Badge bg="warning">In Progress</Badge>
                    )}
                  </td>
<td>
  {!log.completed && (
    <Button
      variant="success"
      size="sm"
      onClick={() => handleCompleteClick(log)}
    >
      Mark Complete
    </Button>
  )}
</td>

                </tr>
              ))}
          </tbody>
        </Table>
      ) : (
        <p>No maintenance logs yet.</p>
      )}

      {/* Modal for selecting parts */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Parts Used</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Part</Form.Label>
              <Form.Select
                value={selectedPart}
                onChange={(e) => {
                  setSelectedPart(e.target.value);
                  setModalError("");
                }}
              >
                <option value="">-- None --</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name} ({item.quantity} left)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {selectedPart && (
              <Form.Group className="mb-3">
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                  type="number"
                  value={quantity}
                  min={1}
                  max={
                    inventory.find((i) => i.name === selectedPart)?.quantity ||
                    1
                  }
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCompleteConfirm}
            disabled={!selectedPart || !quantity || quantity <= 0}
          >
            Confirm & Complete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MaintenanceLogs;
