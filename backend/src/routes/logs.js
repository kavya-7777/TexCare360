const express = require("express");
const router = express.Router();
const pool = require("../db"); // ✅ MySQL connection pool

// ✅ GET all logs
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.id, 
             m.name AS machine, 
             t.name AS technician, 
             l.skill, 
             l.date_time, 
             l.completed, 
             l.parts_used,
             l.tech_id,
             l.machine_id
      FROM maintenance_logs l
      JOIN machines m ON l.machine_id = m.id
      JOIN technicians t ON l.tech_id = t.id
      ORDER BY l.date_time DESC
    `);
    res.json(result[0]); // MySQL2 returns [rows, fields]
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).send("Server error");
  }
});

// ✅ Add new log
router.post("/", async (req, res) => {
  try {
    const { machine, technician, skill, techId, date_time, completed } = req.body;

    // find machine id by name
    const [machineRows] = await pool.query(
      "SELECT id FROM machines WHERE name = ? LIMIT 1",
      [machine]
    );
    if (machineRows.length === 0) {
      return res.status(400).json({ error: "Machine not found" });
    }
    const machineId = machineRows[0].id;

    // find technician id by name if not passed
    let tech_id = techId;
    if (!techId) {
      const [techRows] = await pool.query(
        "SELECT id FROM technicians WHERE name = ? LIMIT 1",
        [technician]
      );
      if (techRows.length === 0) {
        return res.status(400).json({ error: "Technician not found" });
      }
      tech_id = techRows[0].id;
    }

    const [result] = await pool.query(
      "INSERT INTO maintenance_logs (machine_id, tech_id, skill, date_time, completed) VALUES (?, ?, ?, ?, ?)",
      [machineId, tech_id, skill, date_time, completed ? 1 : 0]
    );

    res.json({
      id: result.insertId,
      machine,
      technician,
      skill,
      date: date_time,
      completed: !!completed,
      techId: tech_id,
      partsUsed: null,
    });
  } catch (err) {
    console.error("Error adding log:", err);
    res.status(500).send("Server error");
  }
});

// ✅ Update log (mark complete, add parts used)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, parts_used } = req.body;

    await pool.query(
      "UPDATE maintenance_logs SET completed = ?, parts_used = ? WHERE id = ?",
      [completed ? 1 : 0, parts_used || null, id]
    );

    res.json({ id, completed, parts_used });
  } catch (err) {
    console.error("Error updating log:", err);
    res.status(500).send("Server error");
  }
});

// ✅ Delete log
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM maintenance_logs WHERE id = ?", [id]);
    res.json({ message: "Log deleted" });
  } catch (err) {
    console.error("Error deleting log:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
