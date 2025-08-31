import React, { useState } from "react";
import { Table, Button, Modal, Form, Badge } from "react-bootstrap";
import "./Technicians.css";

function Technicians({ technicians, setTechnicians }) {
  const [showModal, setShowModal] = useState(false);
  const [newTech, setNewTech] = useState({ name: "", skill: "", status: "Available" });
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Handle input change in modal
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

  // ✅ Apply filter + search
  const filteredTechs = technicians.filter((tech) => {
    const matchesFilter = filter === "All" ? true : tech.status === filter;
    const matchesSearch =
      tech.name.toLowerCase().includes(search.toLowerCase()) ||
      tech.skill.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="technicians-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Technicians</h2>

        {/* Filter dropdown */}
        <Form.Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "200px" }}
        >
          <option value="All">All</option>
          <option value="Available">Available</option>
          <option value="Busy">Busy</option>
        </Form.Select>
      </div>

      {/* ✅ Search bar */}
      <Form.Control
        type="text"
        placeholder="Search by name or skill..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />

      <Button variant="primary" className="mb-3" onClick={() => setShowModal(true)}>
        ➕ Add Technician
      </Button>

      {/* Technician Table */}
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
          {filteredTechs.length > 0 ? (
            filteredTechs.map((tech) => (
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
                    disabled={tech.status === "Busy"} // Prevent delete if Busy
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">
                No technicians found.
              </td>
            </tr>
          )}
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
