import express from "express";
import {
  forgotPassword,
  getCurrentUser,
  logout,
  refreshSession,
  resendVerificationEmail,
  signInAction,
  signInWithGoogle,
  signUpAction,
  updatePassword,
  linkEmailLogin,
  updateUser,
  resetPasswordFormPage,
  verifyEmailFromLink,
} from "../controller/user.controller.js";
import { auth } from "../middelware/auth.js";
import { body } from "express-validator";

const route = express.Router();

route.post(
  "/sign-up",
  body("userName", "User Name is required").notEmpty(),
  body("userName", "User Name must contain only alphabets and spaces").matches(/^[A-Za-z\s]+$/),
  body("contactNo", "Contact Number is required").notEmpty(),
  body("email", "email is required").notEmpty(),
  body("password", "Password is required").notEmpty(),
  body("password", "Password should be min 5 characters").isLength({ min: 5}),
  signUpAction
);

route.post(
  "/sign-in",
  body("email", "Invalide Email").isEmail(),
  body("email", "Email is required").notEmpty(),
  body("password", "password is required").notEmpty(),
  signInAction
);

route.post("/google-sign-in", signInWithGoogle);
route.get("/reset-password", resetPasswordFormPage);
route.get("/verify-email", verifyEmailFromLink);
route.post("/resend-verification", resendVerificationEmail);
route.get("/me", auth, getCurrentUser);
route.post("/refresh", refreshSession);
route.post("/logout", logout);
route.post("/forget-password", forgotPassword);
route.post("/update-password", updatePassword);
route.put("/update-user", auth, updateUser);
route.post(
  "/link-email-login",
  auth,
  body("contactNo", "Contact Number is required").notEmpty(),
  body("contactNo", "Contact Number must contain only numbers").matches(/^[0-9]+$/),
  body("password", "Password is required").notEmpty(),
  body("password", "Password should be 5 to 8").isLength({ min: 5, max: 8 }),
  linkEmailLogin
);

export default route;
