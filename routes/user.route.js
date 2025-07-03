import express from "express";
import {  forgotPassword, getUserById, resetPassword, signInAction, signInWithGoogle, signUpAction, updatePassword, verifyEmail } from "../controller/user.controller.js";
import { body } from "express-validator";

const route = express.Router();


route.post("/sign-up",body("userName", "User Name is required").notEmpty(),
body("userName", "User Name must contain only alphabets and spaces").matches(/^[A-Za-z\s]+$/),
body("contactNo", "Contact Number is required").notEmpty(),
body("email", "email is required").notEmpty(),
body("password", "Password is required").notEmpty(),
body("password", "Password should be 5 to 8").isLength({min : 5 , max : 8})
,signUpAction);

route.post("/sign-in",
    body("email","Invalide Email").isEmail(),
    body("email", "Email is required").notEmpty(),
    body("password", "password is required").notEmpty(),
    signInAction
);

//Google SignIn
route.post("/google-sign-in", signInWithGoogle)

route.get("/:id", getUserById);
route.post("/verify", verifyEmail)

route.post("/forget-password", forgotPassword),
route.post("/update-password", updatePassword),
route.post("/reset-password", resetPassword)
export default route;