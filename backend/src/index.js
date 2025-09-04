const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./db");   // ✅ correct

const machinesRouter = require("./routes/machines");
const inventoryRouter = require("./routes/inventory");
const techniciansRouter = require("./routes/technicians");
const logsRouter = require("./routes/logs");
const stockHistoryRoutes = require("./routes/stockHistory");

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use("/api/machines", machinesRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/technicians", techniciansRouter);
app.use("/api/logs", logsRouter);
app.use("/api/stock-history", stockHistoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
