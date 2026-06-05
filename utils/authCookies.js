import jwt from "jsonwebtoken";

const ACCESS_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";
const isProduction = process.env.NODE_ENV === "production";

// HttpOnly cookies: browser sends them automatically; JavaScript cannot read them.
const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true" || isProduction,
  sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax"),
  path: "/",
};

export const accessCookieOptions = {
  ...baseCookieOptions,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

export const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const createAccessToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );

export const createRefreshToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email, type: "refresh" },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );

/** Set both cookies after sign-in or refresh. */
export const setAuthCookies = (res, user) => {
  res.cookie("accessToken", createAccessToken(user), accessCookieOptions);
  res.cookie("refreshToken", createRefreshToken(user), refreshCookieOptions);
};

/** Clear cookies on logout or failed refresh. */
export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", { ...baseCookieOptions });
  res.clearCookie("refreshToken", { ...baseCookieOptions });
};

/** Never send password field to the frontend. */
export const sanitizeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  return safeUser;
};
