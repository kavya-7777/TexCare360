import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavigationBar from "./components/NavigationBar/NavigationBar";
import Dashboard from "./pages/Dashboard/Dashboard";
import Machines from "./pages/Machines/Machines";
import Technicians from "./pages/Technicians/Technicians";
import MaintenanceLogs from "./pages/MaintenanceLogs/MaintenanceLogs";
import Inventory from "./pages/Inventory/Inventory";
import { Container } from "react-bootstrap";

function App() {
  const [machines, setMachines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/machines")
      .then((res) => res.json())
      .then((data) => setMachines(data))
      .catch((err) => console.error("Machines fetch error:", err));

    fetch("http://localhost:5000/api/inventory")
      .then((res) => res.json())
      .then((data) => setInventory(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Inventory fetch error:", err));

    fetch("http://localhost:5000/api/stock-history")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched stock history:", data);
        setStockHistory(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("StockHistory fetch error:", err));

    fetch("http://localhost:5000/api/technicians")
      .then((res) => res.json())
      .then((data) => setTechnicians(data))
      .catch((err) => console.error("Technicians fetch error:", err));

    fetch("http://localhost:5000/api/logs")
      .then((res) => res.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Logs fetch error:", err));
  }, []);

  // ✅ Add log → send to backend
  const addLog = async (machine, technician, skill, techId) => {
    const newLog = {
      machine,
      technician,
      skill,
      date_time: new Date().toISOString().slice(0, 19).replace("T", " "), // MySQL DATETIME format
      techId,
      completed: false,
    };

    try {
      const res = await fetch("http://localhost:5000/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLog),
      });

      const savedLog = await res.json();
      setLogs((prev) => [...prev, savedLog]);
    } catch (err) {
      console.error("Error adding log:", err);
    }
  };

  // ✅ Assign technician and set them to Busy
// ✅ Assign technician and set them to Busy
const assignTechnician = async (techId, machineName, skill, onAssignSuccess) => {
  // Optimistic UI update: close modal immediately
  if (onAssignSuccess) onAssignSuccess();

  // Step 1: Add log
  await addLog(machineName, "Technician", skill, techId);

  // Step 2: Update technician status in backend + frontend
  try {
    const res = await fetch(
      `http://localhost:5000/api/technicians/${techId}/status`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Busy" }),
      }
    );

    const updatedTech = await res.json();

    setTechnicians((prev) =>
      prev.map((t) =>
        t.id === updatedTech.id ? { ...t, status: updatedTech.status } : t
      )
    );

    // ✅ Also update logs instantly with technician name
    setLogs((prev) =>
      prev.map((log) =>
        log.techId === techId && log.machine === machineName
          ? { ...log, technician: updatedTech.name }
          : log
      )
    );

    console.log(`Technician ${updatedTech.name} assigned to ${machineName}`);
  } catch (err) {
    console.error("Error assigning technician:", err);
  }
};


  // ✅ Free technician (set them back to Available)
  const freeTechnician = async (techId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/technicians/${techId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Available" }),
        }
      );

      const updatedTech = await res.json();

      setTechnicians((prev) =>
        prev.map((t) =>
          t.id === updatedTech.id ? { ...t, status: updatedTech.status } : t
        )
      );

      console.log(`Technician ${techId} set to Available`);
    } catch (err) {
      console.error("Error freeing technician:", err);
    }
  };

  return (
    <Router>
      <NavigationBar />
      <Container className="mt-5 pt-5">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/machines"
            element={
              <Machines
                machines={machines}
                setMachines={setMachines}
                assignTechnician={assignTechnician}
                technicians={technicians}
                logs={logs}
                setLogs={setLogs}
              />
            }
          />
          <Route
            path="/technicians"
            element={
              <Technicians
                technicians={technicians}
                setTechnicians={setTechnicians}
              />
            }
          />
          <Route
            path="/maintenance-logs"
            element={
              <MaintenanceLogs
                logs={logs}
                setLogs={setLogs}
                freeTechnician={freeTechnician}
                machines={machines}
                setMachines={setMachines}
                inventory={inventory}
                setInventory={setInventory}
                stockHistory={stockHistory}
                setStockHistory={setStockHistory}
              />
            }
          />
          <Route
            path="/inventory"
            element={
              <Inventory
                inventory={inventory}
                setInventory={setInventory}
                logs={logs}
                setLogs={setLogs}
                stockHistory={stockHistory}
                setStockHistory={setStockHistory}
                machines={machines}
                setMachines={setMachines}
              />
            }
          />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
