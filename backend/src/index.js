// backend/server.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const pool = require("./db");   // existing db helper

const machinesRouter = require("./routes/machines");
const inventoryRouter = require("./routes/inventory");
const techniciansRouter = require("./routes/technicians");
const logsRouter = require("./routes/logs");
const stockHistoryRoutes = require("./routes/stockHistory");

// new auth router
const authRouter = require("./routes/auth");

const app = express();

// CORS: allow credentials and your frontend origin
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser()); // added for cookies

// health check (kept as-is)
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// mount auth router
app.use("/api/auth", authRouter);

// existing routers (kept)
app.use("/api/machines", machinesRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/technicians", techniciansRouter);
app.use("/api/logs", logsRouter);
app.use("/api/stock-history", stockHistoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
