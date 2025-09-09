const express = require("express");
const router = express.Router();
const pool = require("../db"); // MySQL connection

// GET all stock history
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM stock_history ORDER BY created_at DESC"
    );

    // Ensure qty_change is numeric
    const history = rows.map((record) => ({
      id: record.id,
      action: record.action,
      item: record.item,
      qtyChange: parseInt(record.qty_change, 10) || 0, // ✅ force numeric
      user: record.user,
      date: record.created_at
        ? record.created_at.toISOString().replace("T", " ").slice(0, 19)
        : "",
    }));

    return res.json(history); // ✅ always send JSON
  } catch (err) {
    console.error("Error fetching stock history:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST new stock history
router.post("/", async (req, res) => {
    console.log("POST /stock-history body:", req.body);

  try {
    
    const { action, item, qty_change, user } = req.body;

    // ✅ ensure numeric
    const qtyNumber = Number(qty_change);
    if (isNaN(qtyNumber)) return res.status(400).json({ error: "Invalid quantity" });

    const [result] = await pool.query(
      "INSERT INTO stock_history (action, item, qty_change, user) VALUES (?, ?, ?, ?)",
      [action, item, qtyNumber, user]
    );

    res.json({ id: result.insertId, action, item, qty_change: qtyNumber, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE stock history
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
