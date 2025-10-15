import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Badge, Button, Modal } from "react-bootstrap";
import "./Machines.css";

function Machines({ machines, setMachines, technicians, setTechnicians, logs, setLogs, assignTechnician }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  // AUTO-ASSIGN: runs automatically in background
  useEffect(() => {
    const autoAssignMachines = async () => {
      for (const machine of machines) {
        if (machine.status === "Unhealthy") {
          const assignedTech = getAssignedTechnician(machine.name);
          if (!assignedTech) {
            const skillRequired = machine.required_skill || "Mechanical";
            const availableTech = technicians.find(
              (t) => t.status === "Available" && t.skill === skillRequired
            );

            if (availableTech) {
              // Update technician status locally
              setTechnicians((prev) =>
                prev.map((t) =>
                  t.id === availableTech.id ? { ...t, status: "Busy" } : t
                )
              );

              // Add log
              const newLog = {
                machine: machine.name,
                technician: availableTech.name,
                skill: availableTech.skill,
                techId: availableTech.id,
                date_time: new Date().toISOString().slice(0, 19).replace("T", " "),
                completed: false,
              };
              setLogs((prev) => [...prev, newLog]);

              // Update backend
              await axios.post("http://localhost:5000/api/logs", newLog);
              await axios.put(
                `http://localhost:5000/api/technicians/${availableTech.id}/status`,
                { status: "Busy" }
              );
            }
            // ❌ DO NOT open modal automatically
          }
        }
      }
    };

    if (technicians.length > 0) {
      autoAssignMachines();
    }
  }, [machines]); // only runs when machines change

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

  // Assign technician manually from modal
  const handleAssignTechnician = async (machine, technician) => {
    try {
      if (!machine || !technician) return;

      const newLog = {
        machine: machine.name,
        technician: technician.name,
        skill: technician.skill,
        techId: technician.id,
        date_time: new Date().toISOString().slice(0, 19).replace("T", " "),
        completed: false,
      };
      setLogs((prev) => [...prev, newLog]);

      setTechnicians((prev) =>
        prev.map((t) =>
          t.id === technician.id ? { ...t, status: "Busy" } : t
        )
      );

      setShowModal(false);
      setSelectedMachine(null);

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
            <th>Required Skill</th>
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
                <td>{machine.required_skill || "Mechanical"}</td>
                <td>
                  {assignedTech ? (
                    <span>
                      Assigned to <strong>{assignedTech.name}</strong>
                    </span>
                  ) : machine.status === "Unhealthy" ? (
                    <div className="d-flex gap-2">
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => handleAssignClick(machine)}
                      >
                        Auto Assign Technician
                      </Button>
                    </div>
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
            Assign Technician for {selectedMachine?.name} (Required Skill: {selectedMachine?.required_skill || "Mechanical"})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Available Technicians</h5>
          {getAvailableTechnicians().length > 0 ? (
            getAvailableTechnicians().map((tech) => {
              const matchesSkill =
                tech.skill === (selectedMachine?.required_skill || "Mechanical");
              return (
                <div
                  key={tech.id}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <span>
                    {tech.name} ({tech.skill}){" "}
                    <Badge bg={matchesSkill ? "success" : "secondary"}>
                      {matchesSkill ? "Matches Skill" : "Available"}
                    </Badge>
                  </span>
                  <Button
                    variant={matchesSkill ? "primary" : "outline-primary"}
                    size="sm"
                    onClick={() => handleAssignTechnician(selectedMachine, tech)}
                  >
                    Assign
                  </Button>
                </div>
              );
            })
          ) : (
            <p>No available technicians right now.</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Machines;
