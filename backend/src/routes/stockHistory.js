// backend/routes/stockHistory.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // ✅ MySQL connection pool

// ✅ Get all stock history
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM stock_history ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching stock history:", err);
    res.status(500).send("Server error");
  }
});

// ✅ Add stock history record
router.post("/", async (req, res) => {
  try {
    const { action, item, qty_change, user } = req.body;

    const [result] = await pool.query(
      "INSERT INTO stock_history (action, item, qty_change, user) VALUES (?, ?, ?, ?)",
      [action, item, qty_change, user]
    );

    res.json({
      id: result.insertId,
      action,
      item,
      qty_change,
      user,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error inserting stock history:", err);
    res.status(500).send("Server error");
  }
});

// ✅ Delete stock history record
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM stock_history WHERE id = ?", [id]);
    res.json({ message: "Stock history deleted" });
  } catch (err) {
    console.error("Error deleting stock history:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
