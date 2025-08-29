import React, { useEffect, useState } from "react";
import { Table, Alert, Button, Badge } from "react-bootstrap";
import "./MaintenanceLogs.css";

function MaintenanceLogs({ logs, setLogs, freeTechnician, machines, setMachines }) {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (logs.length > 0) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [logs]);

  const handleComplete = (log, index) => {
    if (freeTechnician) {
      freeTechnician(log.techId);
    }

    // ✅ Update logs
    const updatedLogs = [...logs];
    updatedLogs[index].completed = true;
    setLogs(updatedLogs);

    // ✅ Update machine status back to Healthy
    setMachines((prev) =>
      prev.map((m) =>
        m.name === log.machine ? { ...m, status: "Healthy" } : m
      )
    );
  };

  return (
    <div className="logs-page">
      <h2 className="mb-4">Maintenance Logs</h2>

      {showAlert && (
        <Alert variant="success">✅ New log added successfully!</Alert>
      )}

      {logs.length > 0 ? (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Machine</th>
              <th>Technician</th>
              <th>Skill</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.machine}</td>
                <td>{log.technician}</td>
                <td>{log.skill}</td>
                <td>{log.date}</td>
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
                      onClick={() => handleComplete(log, index)}
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
    </div>
  );
}

export default MaintenanceLogs;
