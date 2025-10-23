import React, { useState, useEffect  } from "react";
import { Table, Button, Modal, Form, Badge, Alert } from "react-bootstrap";
import axios from "axios";
import "./Inventory.css";
import moment from "moment-timezone";

function Inventory({ inventory, setInventory, stockHistory, setStockHistory }) {
  const [showModal, setShowModal] = useState(false);
  const [restockModal, setRestockModal] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState(0);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Spare Parts",
    quantity: 0,
    supplier: "",
    leadTime: "",
    expiry: "",
  });
  const [filter, setFilter] = useState("All");

  // 🔎 filter items
  const filteredItems =
    filter === "All"
      ? inventory
      : inventory.filter((item) => item.category === filter);

  // Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  // ➕ Add history log (frontend + backend)
const addHistory = async (action, itemName, qtyChange, user = "Admin") => {
  // Ensure qtyChange is numeric
  const qtyNumber = Number(qtyChange) || 0;

  // Create frontend entry
  const entry = {
  action,
  item: itemName,
  qtyChange: qtyNumber,
  user,
  date: new Date().toISOString()
};


  // Update frontend immediately
  setStockHistory((prev) => [...prev, entry]);

  // Send to backend
  try {
    const payload = {
      action,
      item: itemName,
      qty_change: qtyNumber, // always numeric
      user,
    };

    const res = await axios.post(
      "http://localhost:5000/api/stock-history",
      payload
    );

    // Optional: sync with backend response
    setStockHistory((prev) =>
      prev.map((h) =>
        h.date === entry.date
          ? { ...h, id: res.data.id, qtyChange: res.data.qty_change }
          : h
      )
    );
  } catch (err) {
    console.error("Failed to save stock history:", err);
    // Optional: remove the frontend entry if backend fails
    setStockHistory((prev) =>
      prev.filter((h) => h.date !== entry.date)
    );
    alert("Failed to save stock history. Check backend.");
  }
};

  // ✅ Restock handler
const handleRestockConfirm = async () => {
  const qtyToAdd = Number(restockQty);
  if (!restockItem || qtyToAdd <= 0) return;

  try {
    const updatedData = {
      quantity: restockItem.quantity + qtyToAdd,
    };

    // include new expiry date if user entered it
    if (restockItem.newExpiry) {
      updatedData.expiry = restockItem.newExpiry;
    }

    const res = await axios.put(
      `http://localhost:5000/api/inventory/${restockItem.id}`,
      updatedData
    );

    // update frontend
    setInventory((prev) =>
      prev.map((i) =>
        i.id === restockItem.id
          ? {
              ...i,
              quantity: res.data.quantity,
              expiry: res.data.expiry || i.expiry,
            }
          : i
      )
    );

    await addHistory("Restocked", restockItem.name, qtyToAdd);
  } catch (error) {
    console.error("Error updating stock:", error);
    alert("Failed to restock item. Check backend.");
  }

  setRestockModal(false);
  setRestockItem(null);
  setRestockQty(0);
};


  // ✅ Add item
const handleAddItem = async () => {
  if (!newItem.name || !newItem.quantity) return;

  try {
    const payload = { ...newItem, quantity: Number(newItem.quantity) };
    const res = await axios.post("http://localhost:5000/api/inventory", payload);

    setInventory((prev) => [...prev, res.data]);
await addHistory("Added", res.data.name, res.data.quantity);
  } catch (error) {
    console.error("Error adding item:", error);
    alert("Failed to add item. Check backend.");
  }

  setNewItem({
    name: "",
    category: "Spare Parts",
    quantity: 0,
    supplier: "",
    leadTime: "",
    expiry: "",
  });
  setShowModal(false);
};


  // ✅ Delete item
  const handleDelete = async (id) => {
    const deletedItem = inventory.find((i) => i.id === id);

    try {
      await axios.delete(`http://localhost:5000/api/inventory/${id}`);
      setInventory((prev) => prev.filter((i) => i.id !== id));
      if (deletedItem)
  addHistory("Deleted", deletedItem.name, -deletedItem.quantity); // negative qty change

    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Check backend.");
    }
  };

  // 🚨 Alerts
  const lowStockItems = inventory.filter((i) => i.quantity <= 5);
  const supplierAlerts = lowStockItems.map(
    (i) =>
      `Order ${i.name} from ${i.supplier || "Supplier"} (Lead Time: ${
        i.leadTime || "N/A"
      } days)`
  );

  // 🚨 Expiry Alerts
const today = new Date();
const expiryAlerts = inventory.filter((i) => {
  if (!i.expiry) return false;
  const expiryDate = new Date(i.expiry);
  const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  return diffDays <= 7; // within 7 days or already expired
});

const expiryMessages = expiryAlerts.map((i) => {
  const expiryDate = new Date(i.expiry);
  const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  return diffDays < 0
    ? `${i.name} has already expired on ${expiryDate.toLocaleDateString()}`
    : `${i.name} will expire in ${diffDays} day(s) (on ${expiryDate.toLocaleDateString()})`;
});

  // ✅ Load stock history when page loads
useEffect(() => {
  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/stock-history");

      if (res.data && Array.isArray(res.data)) {
        // Map to ensure qtyChange is numeric
        const mappedHistory = res.data.map((record) => ({
          ...record,
          qtyChange: parseInt(record.qtyChange ?? record.qty_change, 10) || 0,
        }));
        setStockHistory(mappedHistory);
      } else {
        setStockHistory([]);
      }
    } catch (err) {
      console.error("Error fetching stock history:", err);
      setStockHistory([]);
    }
  };

  fetchHistory();
}, []);

  return (
    <div className="inventory-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Inventory</h2>
        <Form.Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "200px" }}
        >
          <option value="All">All</option>
          <option value="Spare Parts">Spare Parts</option>
          <option value="Raw Materials">Raw Materials</option>
          <option value="Maintenance Supplies">Maintenance Supplies</option>
        </Form.Select>
      </div>

      {/* ⚠ Alerts */}
      {lowStockItems.length > 0 && (
        <Alert variant="danger">
          ⚠️ Low Stock Alert:{" "}
          {lowStockItems.map((i) => `${i.name} (${i.quantity})`).join(", ")}
          <hr />
          {supplierAlerts.map((msg, idx) => (
            <div key={idx}>👉 {msg}</div>
          ))}
        </Alert>
      )}

{expiryAlerts.length > 0 && (
  <Alert variant="warning">
    ⚠️ Expiry Alert:
    <ul className="mb-0">
      {expiryMessages.map((msg, idx) => (
        <li key={idx}>{msg}</li>
      ))}
    </ul>
  </Alert>
)}

      <Button variant="primary" className="mb-3" onClick={() => setShowModal(true)}>
        ➕ Add Item
      </Button>

      {/* Inventory Table */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Supplier</th>
            <th>Lead Time</th>
            <th>Expiry</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
<tr
  key={item.id}
  className={
    item.quantity <= 5
      ? "table-danger"
      : item.expiry &&
        new Date(item.expiry) - new Date() <= 7 * 24 * 60 * 60 * 1000
      ? "table-warning"
      : ""
  }
>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>
                <Badge bg={item.quantity <= 5 ? "danger" : "success"}>
                  {item.quantity}
                </Badge>{" "}
                {item.quantity <= 5 && (
                  <Badge bg="warning" text="dark">
                    Low Stock
                  </Badge>
                )}
              </td>
              <td>{item.supplier}</td>
              <td>{item.leadTime}</td>
<td>
  {item.expiry
    ? new Date(item.expiry).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "N/A"}
</td>
              <td className="d-flex gap-2">
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => {
                    setRestockItem(item);
                    setRestockModal(true);
                  }}
                >
                  Restock
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Stock History */}
      <h3 className="mt-4">📜 Stock History</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Action</th>
            <th>Item</th>
            <th>Quantity Change</th>
            <th>User</th>
            <th>Date & Time</th>
          </tr>
        </thead>
       <tbody>
  {stockHistory.map((h, index) => (
    <tr key={index}>
      <td>{h.action}</td>
      <td>{h.item}</td>
      <td>{isNaN(h.qtyChange) ? 0 : h.qtyChange}</td>
      <td>{h.user}</td>
      <td>{moment(h.date).tz("Asia/Kolkata").format("DD MMM YYYY, hh:mm A")}</td>
    </tr>
  ))}
</tbody>

      </Table>

      {/* Add Item Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Inventory Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newItem.name}
                onChange={handleChange}
                placeholder="Enter item name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={newItem.category}
                onChange={handleChange}
              >
                <option>Spare Parts</option>
                <option>Raw Materials</option>
                <option>Maintenance Supplies</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={newItem.quantity}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Supplier</Form.Label>
              <Form.Control
                type="text"
                name="supplier"
                value={newItem.supplier}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Lead Time (days)</Form.Label>
              <Form.Control
                type="text"
                name="leadTime"
                value={newItem.leadTime}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Expiry Date</Form.Label>
              <Form.Control
                type="date"
                name="expiry"
                value={newItem.expiry}
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddItem}>
            Add Item
          </Button>
        </Modal.Footer>
      </Modal>

{/* Restock Modal */}
<Modal show={restockModal} onHide={() => setRestockModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Restock {restockItem?.name}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Quantity to Add</Form.Label>
        <Form.Control
          type="number"
          value={restockQty}
          onChange={(e) => setRestockQty(e.target.value)}
          min={1}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>New Expiry Date (optional)</Form.Label>
        <Form.Control
          type="date"
          value={restockItem?.newExpiry || ""}
          onChange={(e) =>
            setRestockItem((prev) => ({
              ...prev,
              newExpiry: e.target.value,
            }))
          }
        />
      </Form.Group>
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setRestockModal(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleRestockConfirm}>
      Confirm Restock
    </Button>
  </Modal.Footer>
</Modal>
    </div>
  );
}

export default Inventory;
