import React, { useState } from "react";
import { Table, Badge, Button, Modal } from "react-bootstrap";
import "./Machines.css";

function Machines({ machines, setMachines, assignTechnician, technicians, logs }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  const handleAssignClick = (machine) => {
    setSelectedMachine(machine);
    setShowModal(true);
  };

  const handleAssignTechnician = (tech) => {
    assignTechnician(tech.id, selectedMachine.name, tech.skill);

    // ✅ Set machine status to Unhealthy (until task complete)
    setMachines((prev) =>
      prev.map((m) =>
        m.id === selectedMachine.id ? { ...m, status: "Unhealthy" } : m
      )
    );

    setShowModal(false);
  };

  return (
    <div className="machines-page">
      <h2 className="mb-4">Machines</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Machine ID</th>
            <th>Machine Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((machine) => {
            const assignedTech = technicians.find(
              (t) =>
                t.status === "Busy" &&
                logs.some(
                  (l) =>
                    l.machine === machine.name &&
                    l.technician === t.name &&
                    !l.completed
                )
            );

            return (
              <tr key={machine.id}>
                <td>{machine.id}</td>
                <td>{machine.name}</td>
                <td>
                  {machine.status === "Healthy" ? (
                    <Badge bg="success">Healthy</Badge>
                  ) : (
                    <Badge bg="danger">Unhealthy</Badge>
                  )}
                </td>
                <td>
                  {assignedTech ? (
                    <span>
                      Assigned to <strong>{assignedTech.name}</strong>
                    </span>
                  ) : machine.status === "Unhealthy" ? (
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => handleAssignClick(machine)}
                    >
                      Assign Technician
                    </Button>
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Assign Technician for {selectedMachine?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Available Technicians</h5>
          {technicians.length > 0 ? (
            technicians.map((tech) => (
              <div
                key={tech.id}
                className="d-flex justify-content-between align-items-center mb-2"
              >
                <span>
                  {tech.name} ({tech.skill}) -{" "}
                  {tech.status === "Available" ? (
                    <Badge bg="success">Available</Badge>
                  ) : (
                    <Badge bg="secondary">Busy</Badge>
                  )}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAssignTechnician(tech)}
                  disabled={tech.status !== "Available"} // disable Busy techs
                >
                  Assign
                </Button>
              </div>
            ))
          ) : (
            <p>No technicians found.</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Machines;
