import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const checkAuth = (allowedRole = "any") => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication failed" });
      }

      const token = authHeader.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      // Role-based authorization
      if (allowedRole !== "any" && decodedToken.role !== allowedRole) {
        return res.status(403).json({ message: "Authorization failed" });
      }

      // Check user status on every protected request
      const user = await User.findById(decodedToken.userId).select("status role");
      if (!user || user.status === "blocked") {
        return res.status(403).json({ message: "Account is blocked or no longer exists" });
      }

      req.userData = {
        userId: decodedToken.userId,
        role: decodedToken.role,
      };

      next();
    } catch (err) {
      console.error("Auth middleware error:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

export default checkAuth;
