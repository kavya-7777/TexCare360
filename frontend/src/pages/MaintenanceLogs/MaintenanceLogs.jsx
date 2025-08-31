import React, { useEffect, useState } from "react";
import { Table, Alert, Button, Badge, Modal, Form } from "react-bootstrap";
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
}) {
  const [showAlert, setShowAlert] = useState(false);
  const [lowStockAlert, setLowStockAlert] = useState("");
  const [supplierAlert, setSupplierAlert] = useState("");
  const [errorAlert, setErrorAlert] = useState(""); // ❌ error shown on page
  const [modalError, setModalError] = useState(""); // ❌ error shown inside modal
  const [showModal, setShowModal] = useState(false);
  const [selectedLogIndex, setSelectedLogIndex] = useState(null);
  const [selectedPart, setSelectedPart] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [logFilter, setLogFilter] = useState("All");


// ✅ Show "new log added" success alert for 3 sec
useEffect(() => {
  if (logs.length > 0) {
    setShowAlert(true);
    const timer = setTimeout(() => setShowAlert(false), 3000);
    return () => clearTimeout(timer);
  }
}, [logs]);

// ✅ Auto-hide errorAlert after 3 sec
useEffect(() => {
  if (errorAlert) {
    const timer = setTimeout(() => setErrorAlert(""), 3000);
    return () => clearTimeout(timer);
  }
}, [errorAlert]);


  // Open modal before marking complete
  const handleCompleteClick = (index) => {
    setSelectedLogIndex(index);
    setShowModal(true);
    setModalError(""); // clear modal error when opening
  };

  // Finalize completion and deduct inventory
  const handleCompleteConfirm = () => {
    if (selectedLogIndex === null) return;

    const updatedLogs = [...logs];
    const log = updatedLogs[selectedLogIndex];

    if (selectedPart) {
      const selectedItem = inventory.find((i) => i.name === selectedPart);
      if (!selectedItem) return;

      // ❌ Block invalid usage
      if (quantity > selectedItem.quantity) {
        const msg = `❌ Invalid! You cannot use ${quantity} units. Only ${selectedItem.quantity} available.`;
        setModalError(msg);
        setErrorAlert(
          `⚠️ ${log.technician} tried to use ${quantity}x ${selectedItem.name}, but only ${selectedItem.quantity} left.`
        );
        return;
      }

      const newQty = Math.max(selectedItem.quantity - quantity, 0);

      // 🔔 Low stock alert
      if (newQty <= 5) {
        setLowStockAlert(
          `⚠️ Low Stock: ${selectedItem.name} has only ${newQty} left!`
        );
        setSupplierAlert(
          `👉 Order ${selectedItem.name} from ${
            selectedItem.supplier || "Supplier"
          } (Lead Time: ${selectedItem.leadTime || "N/A"} days)`
        );
      }

      // 📜 Add stock history (ONLY ONCE)
      setStockHistory((prevHistory) => [
        ...prevHistory,
        {
          action: "Used",
          item: selectedItem.name,
          qtyChange: `-${quantity}`,
          user: log.technician,
          date: new Date().toLocaleString(),
        },
      ]);

      // Update inventory
      setInventory((prev) =>
        prev.map((item) =>
          item.name === selectedPart ? { ...item, quantity: newQty } : item
        )
      );

      log.partsUsed = `${quantity} x ${selectedPart}`;
    }

    log.completed = true;
    setLogs(updatedLogs);
    // ✅ Mark machine as Healthy once task is completed
setMachines((prev) =>
  prev.map((m) =>
    m.name === log.machine ? { ...m, status: "Healthy" } : m
  )
);
    // Free technician
    if (freeTechnician) {
      freeTechnician(log.techId);
    }

    // Reset modal state
    setShowModal(false);
    setSelectedPart("");
    setQuantity(1);
    setModalError(""); // clear modal error on close
  };

  return (
    <div className="logs-page">
      <h2 className="mb-4">Maintenance Logs</h2>

      {showAlert && (
        <Alert variant="success">✅ New log added successfully!</Alert>
      )}
      {lowStockAlert && <Alert variant="danger">{lowStockAlert}</Alert>}
      {supplierAlert && <Alert variant="warning">{supplierAlert}</Alert>}
      {errorAlert && <Alert variant="danger">{errorAlert}</Alert>}
      
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
    return true; // All
  })
  .map((log, index) => (
              <tr key={index}>
                <td>{log.machine}</td>
                <td>{log.technician}</td>
                <td>{log.skill}</td>
                <td>{log.date}</td>
                <td>{log.partsUsed || "—"}</td>
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
                      onClick={() => handleCompleteClick(index)}
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
          {modalError && <Alert variant="danger">{modalError}</Alert>}{" "}
          {/* inline error in modal */}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Part</Form.Label>
              <Form.Select
                value={selectedPart}
                onChange={(e) => {
                  setSelectedPart(e.target.value);
                  setModalError(""); // reset error on change
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
