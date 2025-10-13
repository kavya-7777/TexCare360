// backend/middleware/authorizeRole.js
module.exports = function authorizeRole(allowedRoles = []) {
  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated." });
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Forbidden." });
      }
      return next();
    } catch (err) {
      console.error("authorizeRole error:", err);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  };
};
