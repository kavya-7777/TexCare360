import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavigationBar from "./components/NavigationBar/NavigationBar";
import Dashboard from "./pages/Dashboard/Dashboard";
import Machines from "./pages/Machines/Machines";
import Technicians from "./pages/Technicians/Technicians";
import MaintenanceLogs from "./pages/MaintenanceLogs/MaintenanceLogs";
import Inventory from "./pages/Inventory/Inventory";
import { Container } from "react-bootstrap";

function App() {
  const [logs, setLogs] = useState([]);

  const [machines, setMachines] = useState([
    { id: 1, name: "Loom-101", status: "Healthy" },
    { id: 2, name: "Spinning-202", status: "Unhealthy" },
    { id: 3, name: "Dyeing-303", status: "Healthy" },
    { id: 4, name: "Knitting-404", status: "Unhealthy" },
  ]);

  // ✅ Technicians state
  const [technicians, setTechnicians] = useState([
    { id: 1, name: "Ravi Kumar", skill: "Mechanical", status: "Available" },
    { id: 2, name: "Anita Sharma", skill: "Electrical", status: "Available" },
    { id: 3, name: "John Doe", skill: "Maintenance", status: "Available" },
  ]);

  const addLog = (machine, technician, skill, techId) => {
  const newLog = {
    machine,
    technician,
    skill,
    date: new Date().toLocaleString(),
    techId,        // ✅ link technician to log
    completed: false,
  };

  setLogs((prevLogs) => [...prevLogs, newLog]);
  };



  // ✅ Assign Technician → set status Busy
  const assignTechnician = (techId, machineName, skill) => {
    const tech = technicians.find((t) => t.id === techId);
    if (!tech) return;
    setTechnicians((prev) =>
      prev.map((t) =>
        t.id === techId ? { ...t, status: "Busy" } : t
      )
    );
    addLog(machineName, tech.name, skill, tech.id);
  };

  const freeTechnician = (techId) => {
    setTechnicians((prev) =>
      prev.map((t) =>
        t.id === techId ? { ...t, status: "Available" } : t
      )
    );
  };

  return (
    <Router>
      <NavigationBar />
      <Container className="mt-5 pt-5">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/machines" element={<Machines machines={machines} setMachines={setMachines} assignTechnician={assignTechnician} technicians={technicians} logs={logs} />} />
          <Route path="/technicians" element={<Technicians technicians={technicians} setTechnicians={setTechnicians} />} />
          <Route path="/maintenance-logs" element={<MaintenanceLogs logs={logs} freeTechnician={freeTechnician} setLogs={setLogs} machines={machines} setMachines={setMachines} />} />
          <Route path="/inventory" element={<Inventory />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
