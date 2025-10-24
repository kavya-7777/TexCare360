import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate} from "react-router-dom";import NavigationBar from "./components/NavigationBar/NavigationBar";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import Machines from "./pages/Machines/Machines";
import Technicians from "./pages/Technicians/Technicians";
import MaintenanceLogs from "./pages/MaintenanceLogs/MaintenanceLogs";
import Inventory from "./pages/Inventory/Inventory";
import { Container } from "react-bootstrap";
import axios from "axios";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Forbidden from "./pages/Forbidden/Forbidden"; // adjust the path as needed


function App() {
  const {loading, user} = useAuth();
  const [machines, setMachines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Fetch all data from backend
useEffect(() => {
  const fetchAllData = async () => {
    try {
      const [machinesRes, inventoryRes, stockHistoryRes, techRes, logsRes] =
        await Promise.all([
          axios.get("http://localhost:5000/api/machines"),
          axios.get("http://localhost:5000/api/inventory"),
          axios.get("http://localhost:5000/api/stock-history"),
          axios.get("http://localhost:5000/api/technicians"),
          axios.get("http://localhost:5000/api/logs"),
        ]);

      setMachines(machinesRes.data);

      setInventory(
        Array.isArray(inventoryRes.data)
          ? inventoryRes.data.map((item) => ({
              id: item.id,
              name: item.name,
              category: item.category,
quantity: Number(item.quantity) || 0,
              supplier: item.supplier,
              leadTime: item.leadTime || item.lead_time,
              expiry: item.expiry,
            }))
          : []
      );

setStockHistory(
  Array.isArray(stockHistoryRes.data)
    ? stockHistoryRes.data.map((h) => ({
        id: h.id,
        action: h.action,
        item: h.item,
        qtyChange: h.qty_change ?? h.qtyChange ?? 0, // use existing value
        user: h.user,
        date: h.created_at ?? h.date,
      }))
    : []
);


      setTechnicians(techRes.data);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  fetchAllData();
}, []);


  // Inventory helpers
  const addInventoryItem = async (item) => {
    try {
      const res = await axios.post("http://localhost:5000/api/inventory", item);
      setInventory((prev) => [...prev, res.data]);
      return res.data;
    } catch (err) {
      console.error("Error adding inventory item:", err);
    }
  };

const updateInventoryItem = async (id, updatedFields) => {
  try {
    const res = await axios.put(
      `http://localhost:5000/api/inventory/${id}`,
      updatedFields
    );

    setInventory((prev) =>
  prev.map((item) => {
    if (item.id === id) {
      return { ...item, quantity: Number(res.data.quantity) || item.quantity };
    }
    return item;
  })
);



    return res.data;
  } catch (err) {
    console.error("Error updating inventory item:", err);
  }
};


  const deleteInventoryItem = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/inventory/${id}`);
      setInventory((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Error deleting inventory item:", err);
    }
  };

const addStockHistory = async (entry) => {
  try {
    const res = await axios.post("http://localhost:5000/api/stock-history", {
      action: entry.action,
      item: entry.item,
      qty_change: entry.qtyChange,
      user: entry.user,
    });

    const newEntry = {
      id: res.data.id,
      action: res.data.action,
      item: res.data.item,
      qtyChange: res.data.qty_change,
      user: res.data.user,
      date: res.data.created_at,
    };

    // ✅ Update frontend state
    setStockHistory((prev) => [...prev, newEntry]);
  } catch (err) {
    console.error("Error adding stock history:", err);
  }
};

  // Logs helper
  const addLog = async (machine, technician, skill, techId) => {
    const newLog = {
      machine,
      technician,
      skill,
      date_time: new Date().toISOString().slice(0, 19).replace("T", " "),
      techId,
      completed: false,
    };
    try {
      const res = await axios.post("http://localhost:5000/api/logs", newLog);
      setLogs((prev) => [...prev, res.data]);
      return res.data;
    } catch (err) {
      console.error("Error adding log:", err);
    }
  };

  // Technician helpers
  const assignTechnician = async (techId, machineName, skill, onAssignSuccess) => {
    if (onAssignSuccess) onAssignSuccess();

    await addLog(machineName, "Technician", skill, techId);

    try {
      const res = await axios.put(
        `http://localhost:5000/api/technicians/${techId}/status`,
        { status: "Busy" }
      );
      const updatedTech = res.data;
      setTechnicians((prev) =>
        prev.map((t) =>
          t.id === updatedTech.id ? { ...t, status: updatedTech.status } : t
        )
      );

      setLogs((prev) =>
        prev.map((log) =>
          log.techId === techId && log.machine === machineName
            ? { ...log, technician: updatedTech.name }
            : log
        )
      );
    } catch (err) {
      console.error("Error assigning technician:", err);
    }
  };

  const freeTechnician = async (techId) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/technicians/${techId}/status`,
        { status: "Available" }
      );
      const updatedTech = res.data;
      setTechnicians((prev) =>
        prev.map((t) =>
          t.id === updatedTech.id ? { ...t, status: updatedTech.status } : t
        )
      );
    } catch (err) {
      console.error("Error freeing technician:", err);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
     <>
      <NavigationBar />
      <Container className="mt-5 pt-5">
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/" element={<Navigate to="/dashboard" />} />

  {/* 403 page */}
  <Route path="/forbidden" element={<Forbidden />} />

  {/* ✅ Routes allowed for BOTH Admin & Technician */}
  <Route element={<ProtectedRoute allowedRoles={["Admin", "Technician"]} />}>
    <Route path="/dashboard" element={<Dashboard />} />
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
          currentUser={user}
        />
      }
    />
  </Route>

  {/* ✅ Admin-only routes */}
  <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
    <Route
      path="/machines"
      element={
        <Machines
          machines={machines}
          setMachines={setMachines}
          assignTechnician={assignTechnician}
          technicians={technicians}
          setTechnicians={setTechnicians}
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
          addInventoryItem={addInventoryItem}
          updateInventoryItem={updateInventoryItem}
          deleteInventoryItem={deleteInventoryItem}
          addStockHistory={addStockHistory}
        />
      }
    />
  </Route>

  {/* Fallback */}
  <Route path="*" element={<Login />} />
</Routes>
      </Container>
    </>  
  );
}

export default App;
