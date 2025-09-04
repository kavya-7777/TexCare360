import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Badge, Button, Modal } from "react-bootstrap";
import "./Machines.css";

function Machines({ machines, setMachines, technicians, setTechnicians, logs, setLogs, assignTechnician }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  // Fetch machines on mount
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/machines")
      .then((res) => setMachines(res.data))
      .catch((err) => console.error("Error fetching machines:", err));
  }, [setMachines]);

  // Open modal
  const handleAssignClick = (machine) => {
    setSelectedMachine(machine);
    setShowModal(true);
  };

  // Assign technician
  const handleAssignTechnician = async (machine, technician) => {
    try {
      if (!machine || !technician) return;

      // 1️⃣ Optimistically update logs
      const newLog = {
        machine: machine.name,
        technician: technician.name,
        skill: technician.skill,
        techId: technician.id,
        date_time: new Date().toISOString().slice(0, 19).replace("T", " "),
        completed: false,
      };
      setLogs((prev) => [...prev, newLog]);

      // 2️⃣ Optimistically update technician status locally
      setTechnicians((prev) =>
        prev.map((t) =>
          t.id === technician.id ? { ...t, status: "Busy" } : t
        )
      );

      // 3️⃣ Close modal
      setShowModal(false);
      setSelectedMachine(null);

      // 4️⃣ Update backend asynchronously
      await axios.post("http://localhost:5000/api/logs", newLog);
      await axios.put(
        `http://localhost:5000/api/technicians/${technician.id}/status`,
        { status: "Busy" }
      );
    } catch (err) {
      console.error("Error assigning technician:", err);
    }
  };

  // Get technician assigned to a machine
  const getAssignedTechnician = (machineName) =>
    technicians.find(
      (t) =>
        t.status === "Busy" &&
        logs.some((l) => l.machine === machineName && l.technician === t.name && !l.completed)
    );

  // Available technicians dynamically calculated
  const getAvailableTechnicians = () =>
    technicians.filter((t) => t.status === "Available");

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
            const assignedTech = getAssignedTechnician(machine.name);
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
          {getAvailableTechnicians().length > 0 ? (
            getAvailableTechnicians().map((tech) => (
              <div
                key={tech.id}
                className="d-flex justify-content-between align-items-center mb-2"
              >
                <span>
                  {tech.name} ({tech.skill}) <Badge bg="success">Available</Badge>
                </span>
                <Button
    variant="primary"
    size="sm"
    onClick={() => assignTechnician(tech.id, selectedMachine.name, tech.skill, () => {
        setShowModal(false);
        setSelectedMachine(null);
    })}
>
    Assign
</Button>

              </div>
            ))
          ) : (
            <p>No available technicians right now.</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Machines;
