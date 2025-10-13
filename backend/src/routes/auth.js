// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db"); // use existing db pool
const router = express.Router();

const SALT_ROUNDS = 10;
const TOKEN_NAME = "token";
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const ALLOWED_ROLES = ["Admin", "Technician", "Manager"];

function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "7d" });
}

function cookieOptions() {
  const opts = {
    httpOnly: true,
    maxAge: TOKEN_MAX_AGE,
    sameSite: "lax",
  };
  if (process.env.NODE_ENV === "production") {
    opts.secure = true; // send only over HTTPS in production
  }
  return opts;
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

    // Check existing user
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, password_hash, role]
    );

    const user = {
      id: result.insertId,
      name,
      email,
      role,
    };

    const token = createToken(user);

    res.cookie(TOKEN_NAME, token, cookieOptions());
    return res.status(201).json({ success: true, user });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Server error during signup." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    const [rows] = await pool.query("SELECT id, name, email, password_hash, role FROM users WHERE email = ?", [email]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const userRow = rows[0];
    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
    };

    const token = createToken(user);
    res.cookie(TOKEN_NAME, token, cookieOptions());
    return res.json({ success: true, user });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.cookie(TOKEN_NAME, "", { maxAge: 0, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return res.json({ success: true, message: "Logged out." });
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies && req.cookies[TOKEN_NAME];
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated." });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

    // optionally confirm user still exists in DB
    const [rows] = await pool.query("SELECT id, name, email, role FROM users WHERE id = ?", [payload.id]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: "User not found." });
    }
    const user = rows[0];
    return res.json({ success: true, user });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
