import React, { useState } from "react";
import { Table, Button, Modal, Form, Badge } from "react-bootstrap";
import "./Technicians.css";

function Technicians({ technicians, setTechnicians }) {
  const [showModal, setShowModal] = useState(false);
  const [newTech, setNewTech] = useState({ name: "", skill: "", status: "Available" });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTech((prev) => ({ ...prev, [name]: value }));
  };

  // Add technician
  const handleAddTechnician = () => {
    if (!newTech.name || !newTech.skill) return;

    const newEntry = {
      id: technicians.length + 1,
      ...newTech,
    };

    setTechnicians((prev) => [...prev, newEntry]);
    setNewTech({ name: "", skill: "", status: "Available" });
    setShowModal(false);
  };

  // Delete technician
  const handleDelete = (id) => {
    setTechnicians((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="technicians-page">
      <h2 className="mb-4">Technicians</h2>

      <Button variant="primary" className="mb-3" onClick={() => setShowModal(true)}>
        ➕ Add Technician
      </Button>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Skill</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {technicians.map((tech) => (
            <tr key={tech.id}>
              <td>{tech.id}</td>
              <td>{tech.name}</td>
              <td>{tech.skill}</td>
              <td>
                <Badge bg={tech.status === "Available" ? "success" : "warning"}>
                  {tech.status}
                </Badge>
              </td>
              <td>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(tech.id)}
                  disabled={tech.status === "Busy"}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Add Technician Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Technician</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newTech.name}
                onChange={handleChange}
                placeholder="Enter technician name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Skill</Form.Label>
              <Form.Control
                type="text"
                name="skill"
                value={newTech.skill}
                onChange={handleChange}
                placeholder="Enter skill (e.g., Electrical, Mechanical)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={newTech.status}
                onChange={handleChange}
              >
                <option>Available</option>
                <option>Busy</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddTechnician}>
            Add Technician
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Technicians;
