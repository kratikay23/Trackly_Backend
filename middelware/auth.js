import jwt from "jsonwebtoken";

/** Read JWT from HttpOnly cookie first, then Authorization header (legacy fallback). */
export const getTokenFromRequest = (req) => {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === "string") {
    return authHeader;
  }

  return null;
};

/** Protect routes: verify access token and attach user info to req.user. */
export const auth = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ error: "Access Denied. Not authenticated." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.userId, email: decoded.email };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
