import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: "Access Denied. Token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.userId, email: decoded.email };

    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
