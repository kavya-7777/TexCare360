// backend/routes/technicians.js

const express = require("express");
const pool = require("../db");
const router = express.Router();

// ✅ Get all technicians
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM technicians");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching technicians:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Add technician
router.post("/", async (req, res) => {
  const { name, skill, status } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO technicians (name, skill, status) VALUES (?, ?, ?)",
      [name, skill, status || "Available"]
    );
    res.json({
      id: result.insertId,
      name,
      skill,
      status: status || "Available",
    });
  } catch (err) {
    console.error("Error adding technician:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Update technician status
router.put("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE technicians SET status = ? WHERE id = ?",
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Technician not found" });
    }

    const [rows] = await pool.query("SELECT * FROM technicians WHERE id = ?", [id]);
    res.json(rows[0]); // return updated technician
  } catch (err) {
    console.error("Error updating technician:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// ✅ Delete technician (blocked if Busy)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [logs] = await pool.query("SELECT * FROM maintenance_logs WHERE tech_id = ?", [id]);
    if (logs.length > 0) {
      return res.status(400).json({ error: "Cannot delete technician with existing logs" });
    }

    const [result] = await pool.query("DELETE FROM technicians WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Technician not found" });
    }

    res.json({ success: true, message: "Technician deleted successfully" });
  } catch (err) {
    console.error("Error deleting technician:", err);
    res.status(500).json({ error: "Database error" });
  }
});


module.exports = router;
