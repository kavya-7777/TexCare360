// backend/middleware/authenticate.js
const jwt = require("jsonwebtoken");

const TOKEN_NAME = "token";

function authenticate(req, res, next) {
  try {
    const token = req.cookies && req.cookies[TOKEN_NAME];
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated." });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

    // attach user info (minimal) to req.user
    req.user = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch (err) {
    console.error("Authentication middleware error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

module.exports = authenticate;
