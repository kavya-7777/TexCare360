const express = require("express");
const router = express.Router();
const pool = require("../db"); // ✅ MySQL promise connection

// 🔄 Convert snake_case → camelCase consistently
const toCamel = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  quantity: row.quantity,
  supplier: row.supplier,
  leadTime: row.lead_time,
  expiry: row.expiry,
});

// ✅ GET all inventory items
router.get("/", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM inventory ORDER BY id ASC");
    res.json(results.map(toCamel));
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ➕ Add new inventory item
router.post("/", async (req, res) => {
  const { name, category, quantity, supplier, leadTime, expiry } = req.body;

  try {
    const sql = `INSERT INTO inventory (name, category, quantity, supplier, lead_time, expiry)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.query(sql, [name, category, quantity, supplier, leadTime, expiry]);

    res.json(
      toCamel({
        id: result.insertId,
        name,
        category,
        quantity,
        supplier,
        lead_time: leadTime,
        expiry,
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ✏️ Update inventory item
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, category, quantity, supplier, leadTime, expiry } = req.body;

  try {
    const [current] = await pool.query("SELECT * FROM inventory WHERE id=?", [id]);
    if (!current[0]) return res.status(404).json({ error: "Item not found" });

    const updated = {
      name: name ?? current[0].name,
      category: category ?? current[0].category,
quantity: quantity !== undefined ? Number(quantity) : current[0].quantity,
      supplier: supplier ?? current[0].supplier,
leadTime: leadTime !== undefined ? Number(leadTime) : current[0].lead_time,
      expiry: expiry ?? current[0].expiry,
    };

    const sql = `UPDATE inventory 
                 SET name=?, category=?, quantity=?, supplier=?, lead_time=?, expiry=?
                 WHERE id=?`;

    const [result] = await pool.query(sql, [
      updated.name,
      updated.category,
      updated.quantity,
      updated.supplier,
      updated.leadTime,
      updated.expiry,
      id,
    ]);

    res.json(toCamel({ id, ...updated }));
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


// 🗑️ Delete inventory item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM inventory WHERE id=?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item deleted", id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
