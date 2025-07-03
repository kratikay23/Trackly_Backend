import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import admin from "../Firebase/Service.js";
import User from "../models/user.model.js";

dotenv.config();

export const signInAction = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid EmailId" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

        if (!user.verified) {
            return res.status(403).json({ message: "Your account is not verified. Please verify it first." });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "15d" }
        );

        return res.status(200).json({ message: "Sign-in Successful", token });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Issue", error });
    }
};

export const signInWithGoogle = async (req, res) => {
    try {
        const { token } = req.body;
        const decoded = await admin.auth().verifyIdToken(token);
        const { email, name, picture } = decoded;

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ userName: name, email, contactNo: '', password: '', authProvider: "google" });
            await user.save();
        }

        const appToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.json({ token: appToken, user });
    } catch (error) {
        console.error("Google SignIn Error", error);
        return res.status(401).json({ error: "Invalid Firebase Token" });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOneAndUpdate(
            { email },
            { verified: true },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: "Email not found" });

        return res.status(200).json({ message: "Account verified successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to verify email." });
    }
};

export const signUpAction = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) return res.status(400).json({ error: error.array() });

        let { userName, contactNo, email, password } = req.body;

        const isExist = await User.findOne({ email });
        if (isExist) return res.status(400).json({ error: "Email already exists" });

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newUser = new User({
            userName,
            contactNo,
            email,
            password: hashedPassword,
            authProvider: 'email'
        });

        await newUser.save();

        const emailStatus = await sendEmail(email, userName);
        return res.status(201).json({
            message: "Email sent for verification.",
            user: newUser,
            email: emailStatus
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

const sendEmail = (toEmail, touserName) => {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_ID,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        let mailOption = {
            from: process.env.GMAIL_ID,
            to: toEmail,
            subject: 'Account Verification',
            html: `<h4>Dear ${touserName} </h4>
                   <p>Thank you for joining us</p>
                   <form method="post" action="http://localhost:3000/user/verify">
                       <input type="hidden" value="${toEmail}" name="email"/>
                       <button type="submit" style="background-color:mediumseagreen;width:200px;height:60px;color:white;">Verify</button>
                   </form>
                   <h6>Thanks & Regards</h6><b>Trackly App Team</b>`
        };

        transporter.sendMail(mailOption, (error, info) => {
            if (error) reject(false);
            else resolve(true);
        });
    });
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const changePassword = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty())
            return res.status(400).json({ message: "Bad request", error: error.array() });

        const userId = req.user.userId;
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch)
            return res.status(401).json({ message: "Old password is incorrect" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ 1. Validation
        if (!email || !password)
            return res.status(400).json({ message: "Email and password are required." });

        // ✅ 2. Find user
        const user = await User.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found" });

        // ✅ 3. Hash password and save
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        // ✅ 4. Success response
        return res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const error = validationResult(req);
        if (!error.isEmpty())
            return res.status(400).json({ message: "Bad request", error: error.array() });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User with this email does not exist" });

        const emailStatus = await forgetPasswordEmail(email, user.userName);
        return res.status(201).json({ message: "Email sent for verification", email: emailStatus });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty())
            return res.status(400).json({ message: "Bad request", error: error.array() });

        const { token, newPassword } = req.body;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({ message: "Password reset successful" });
    } catch (err) {
        res.status(400).json({ message: "Invalid or expired token", error: err.message });
    }
};

const forgetPasswordEmail = (toEmail, touserName) => {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_ID,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        // You can create a token (optional but more secure)
        const resetLink = `http://localhost:3001/reset-password?email=${encodeURIComponent(toEmail)}`;

        let mailOption = {
            from: process.env.GMAIL_ID,
            to: toEmail,
            subject: 'Forgot Password',
            html: `<div>
                <h1>Trackly</h1>
                <h4>Dear ${touserName},</h4>
                <p>Click the button below to reset your password:</p>
                <a href="${resetLink}" style="display:inline-block;background-color:blue;width:200px;height:60px;line-height:60px;text-align:center;color:white;text-decoration:none;font-weight:bold;border-radius:5px;">
                    Reset Password
                </a>
                <p>If this wasn't you, please ignore this email.</p>
                <h6>Thanks & Regards</h6><b>Trackly App Team</b>
            </div>`
        };

        transporter.sendMail(mailOption, (error, info) => {
            if (error) reject(false);
            else resolve(true);
        });
    });
};
