// backend/src/routes/machines.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

/**
 * GET /api/machines
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, status, created_at AS createdAt FROM machines ORDER BY id"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/machines/:id
 */
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query(
      "SELECT id, name, status, created_at AS createdAt FROM machines WHERE id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Machine not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/machines
 */
router.post("/", async (req, res) => {
  const { name, status = "Healthy" } = req.body;
  if (!name) return res.status(400).json({ error: "Missing machine name" });

  try {
    const [result] = await pool.query(
      "INSERT INTO machines (name, status) VALUES (?, ?)",
      [name, status]
    );
    const insertedId = result.insertId;
    const [rows] = await pool.query(
      "SELECT id, name, status, created_at AS createdAt FROM machines WHERE id = ?",
      [insertedId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/machines/:id
 */
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const { name, status } = req.body;
  if (!name && !status)
    return res.status(400).json({ error: "Nothing to update" });

  const updates = [];
  const params = [];
  if (name) {
    updates.push("name = ?");
    params.push(name);
  }
  if (status) {
    updates.push("status = ?");
    params.push(status);
  }
  params.push(id);

  try {
    await pool.query(`UPDATE machines SET ${updates.join(", ")} WHERE id = ?`, params);
    const [rows] = await pool.query(
      "SELECT id, name, status, created_at AS createdAt FROM machines WHERE id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Machine not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/machines/:id
 */
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [result] = await pool.query("DELETE FROM machines WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Machine not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/machines/:id/assign
 */
router.post("/:id/assign", async (req, res) => {
  const machineId = req.params.id;
  const { techId } = req.body;

  if (!techId) return res.status(400).json({ error: "Missing techId" });

  try {
    const [techRows] = await pool.query("SELECT * FROM technicians WHERE id = ?", [techId]);
    if (techRows.length === 0) return res.status(404).json({ error: "Technician not found" });

    const technician = techRows[0];
    if (technician.status === "Busy") {
      return res.status(400).json({ error: "Technician already busy" });
    }

    await pool.query("UPDATE technicians SET status = 'Busy' WHERE id = ?", [techId]);
    await pool.query("UPDATE machines SET status = 'Unhealthy' WHERE id = ?", [machineId]);

    res.json({ message: "Technician assigned successfully", machineId, techId });
  } catch (err) {
    console.error("Error assigning technician:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/machines/:id/unassign
 */
router.post("/:id/unassign", async (req, res) => {
  const machineId = req.params.id;
  const { techId } = req.body;

  if (!techId) return res.status(400).json({ error: "Missing techId" });

  try {
    const [techRows] = await pool.query("SELECT * FROM technicians WHERE id = ?", [techId]);
    if (techRows.length === 0) return res.status(404).json({ error: "Technician not found" });

    const technician = techRows[0];
    if (technician.status === "Available") {
      return res.status(400).json({ error: "Technician already available" });
    }

    await pool.query("UPDATE technicians SET status = 'Available' WHERE id = ?", [techId]);
    await pool.query("UPDATE machines SET status = 'Healthy' WHERE id = ?", [machineId]);

    res.json({ message: "Technician unassigned successfully", machineId, techId });
  } catch (err) {
    console.error("Error unassigning technician:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
