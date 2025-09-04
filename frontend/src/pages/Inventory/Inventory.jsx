import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Badge, Alert } from "react-bootstrap";
import axios from "axios";
import "./Inventory.css";

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

  // ✅ Fetch inventory from backend (already camelCase)
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/inventory")
      .then((res) => setInventory(res.data))
      .catch((err) => console.error("Error fetching inventory:", err));
  }, [setInventory]);

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

  // ➕ History log
  const addHistory = (action, itemName, qtyChange, user = "Admin") => {
    const entry = {
      action,
      item: itemName,
      qtyChange,
      user,
      date: new Date().toLocaleString(),
    };
    setStockHistory((prev) => [...prev, entry]);
  };

  // ✅ Restock handler
  const handleRestockConfirm = async () => {
    if (!restockItem || restockQty <= 0) return;

    try {
      const res = await axios.put(
        `http://localhost:5000/api/inventory/${restockItem.id}`,
        { ...restockItem, quantity: restockItem.quantity + parseInt(restockQty) }
      );

      setInventory((prev) =>
        prev.map((i) => (i.id === restockItem.id ? res.data : i))
      );

      addHistory("Restocked", restockItem.name, `+${restockQty}`);
    } catch (error) {
      console.error("Error updating stock:", error);
    }

    setRestockModal(false);
    setRestockItem(null);
    setRestockQty(0);
  };

  // ✅ Add item
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.quantity) return;

    try {
      const res = await axios.post("http://localhost:5000/api/inventory", newItem);
      setInventory((prev) => [...prev, res.data]);
      addHistory("Added", res.data.name, `+${res.data.quantity}`);
    } catch (error) {
      console.error("Error adding item:", error);
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
      if (deletedItem) addHistory("Deleted", deletedItem.name, deletedItem.quantity);
    } catch (error) {
      console.error("Error deleting item:", error);
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
            <tr key={item.id} className={item.quantity <= 5 ? "table-danger" : ""}>
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
              <td>{item.expiry || "N/A"}</td>
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
              <td>{h.qtyChange}</td>
              <td>{h.user}</td>
              <td>{h.date}</td>
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
              <Form.Select name="category" value={newItem.category} onChange={handleChange}>
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
            <Form.Group>
              <Form.Label>Quantity to Add</Form.Label>
              <Form.Control
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                min={1}
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
