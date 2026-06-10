import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import admin from "../Firebase/Service.js";
import User from "../models/user.model.js";
import {
    setAuthCookies,
    clearAuthCookies,
    sanitizeUser,
} from "../utils/authCookies.js";
import { sendMail } from "../utils/mailer.js";

const getBackendUrl = () =>
    process.env.BACKEND_PUBLIC_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${process.env.PORT || 5000}`;

const getFrontendUrl = () =>
    process.env.FRONTEND_URL || "https://trackly-c68y.onrender.com";

const escapeHtml = (value) =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");

export const linkEmailLogin = async (req, res) => {
    try {
        const { contactNo, password, userName } = req.body;
        const trimmedContact = (contactNo || "").trim();
        const trimmedPassword = (password || "").trim();
        const trimmedName = (userName || "").trim();

        if (trimmedName && !/^[A-Za-z\s]+$/.test(trimmedName)) {
            return res.status(400).json({ message: "Username must contain only alphabets and spaces" });
        }
        if (!trimmedContact) {
            return res.status(400).json({ message: "Contact Number cannot be empty" });
        }
        if (!/^[0-9]+$/.test(trimmedContact)) {
            return res.status(400).json({ message: "Contact Number must contain only numbers" });
        }
        if (!trimmedPassword || trimmedPassword.length < 5 || trimmedPassword.length > 8) {
            return res.status(400).json({ message: "Password should be 5 to 8 characters" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.authProvider !== "google") {
            return res.status(400).json({ message: "Email login is already set up for this account" });
        }

        if (trimmedName) user.userName = trimmedName;
        user.contactNo = trimmedContact;
        user.password = bcrypt.hashSync(trimmedPassword, 10);
        user.authProvider = "both";
        user.verified = true;
        await user.save();

        return res.status(200).json({
            message: "Profile saved. You can now sign in with Google or email and password.",
            user: sanitizeUser(user),
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Issue", error });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { userName, contactNo } = req.body;
        const trimmedName = (userName || "").trim();
        const trimmedContact = (contactNo || "").trim();

        if (!trimmedName) {
            return res.status(400).json({ message: "Username cannot be empty" });
        }
        if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
            return res.status(400).json({ message: "Username must contain only alphabets and spaces" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isGoogleOnly = user.authProvider === "google";

        if (!isGoogleOnly) {
            if (!trimmedContact) {
                return res.status(400).json({ message: "Contact Number cannot be empty" });
            }
            if (!/^[0-9]+$/.test(trimmedContact)) {
                return res.status(400).json({ message: "Contact Number must contain only numbers" });
            }
        }

        const nameChanged = user.userName !== trimmedName;
        const contactChanged = !isGoogleOnly && user.contactNo !== trimmedContact;

        if (!nameChanged && !contactChanged) {
            return res.status(200).json({
                message: "No changes to save",
                user: sanitizeUser(user),
            });
        }

        user.userName = trimmedName;
        if (!isGoogleOnly) {
            user.contactNo = trimmedContact;
        }

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            user: sanitizeUser(user),
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Issue", error });
    }
};

export const signInAction = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid EmailId" });

        if (user.authProvider === "google" || !user.password) {
            return res.status(400).json({
                message: "This account uses Google sign-in. Sign in with Google or link a password from Profile.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

        if (!user.verified) {
            return res.status(403).json({ message: "Your account is not verified. Please verify it first." });
        }

        setAuthCookies(res, user);

        return res.status(200).json({
            message: "Sign-in Successful",
            user: sanitizeUser(user),
        });
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
            user = new User({
                userName: name,
                email,
                contactNo: '',
                password: '',
                authProvider: "google",
                verified: true
            });
            await user.save();
        }

        setAuthCookies(res, user);

        return res.json({ user: sanitizeUser(user) });
    } catch (error) {
        return res.status(401).json({ error: "Invalid Firebase Token" });
    }
};

export const signUpAction = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) return res.status(400).json({ error: error.array() });

        let { userName, contactNo, email, password } = req.body;

        const isExist = await User.findOne({ email });
        if (isExist) {
            if (isExist.authProvider === "google") {
                return res.status(400).json({
                    error: "This email is registered with Google. Sign in with Google, then add a password from Profile.",
                });
            }
            return res.status(400).json({ error: "Email already exists" });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newUser = new User({
            userName,
            contactNo,
            email,
            password: hashedPassword,
            authProvider: 'email'
        });

        await newUser.save();

        const verifyLink = buildVerifyLink(email);
        const devFallback = process.env.DEV_LOG_VERIFY_LINK === "true";

        try {
            await sendVerificationEmail(email, userName);
            return res.status(201).json({
                message: "Email sent for verification. Check your inbox, then sign in.",
                emailSent: true,
            });
        } catch (emailError) {

            if (devFallback) {
                return res.status(201).json({
                    message: "Account created. Email could not be sent — use the link below to verify.",
                    devVerifyLink: verifyLink,
                    sendGridHint:
                        "Verify your sender email in SendGrid (Settings → Sender Authentication), set SENDGRID_FROM to that address, then restart the server.",
                    emailSent: false,
                });
            }

            return res.status(500).json({ error: "Failed to send verification email." });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error." });
    }
};

const buildVerifyLink = (toEmail) => {
    return `${getBackendUrl()}/user/verify-email?email=${encodeURIComponent(toEmail)}`;
};

const sendVerificationEmail = (toEmail, userName) => {
    const verifyLink = buildVerifyLink(toEmail);
    return sendMail({
        to: toEmail,
        subject: "Account Verification - Trackly",
        html: `<h4>Dear ${userName}</h4>
               <p>Thank you for joining Trackly. Click below to verify your account:</p>
               <a href="${verifyLink}" style="display:inline-block;background-color:mediumseagreen;padding:12px 24px;color:white;text-decoration:none;">Verify Email</a>
               <h6>Thanks & Regards</h6><b>Trackly App Team</b>`,
    });
};

export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "Email not found" });
        if (user.verified) return res.status(400).json({ error: "Account is already verified" });

        const verifyLink = buildVerifyLink(email);
        const devFallback = process.env.DEV_LOG_VERIFY_LINK === "true";

        try {
            await sendVerificationEmail(email, user.userName);
            return res.status(200).json({ message: "Verification email sent." });
        } catch (emailError) {
            if (devFallback) {
                return res.status(200).json({
                    message: "Email could not be sent. Use this link to verify:",
                    verifyLink,
                });
            }
            return res.status(500).json({ error: "Failed to send verification email." });
        }
    } catch (error) {
        return res.status(500).json({ error: "Failed to resend verification email." });
    }
};

export const resetPasswordRedirect = (req, res) => {
    const email = (req.query.email || "").trim();
    if (!email) {
        return res.redirect(`${getFrontendUrl()}/forget-password`);
    }
    return res.redirect(
        `${getFrontendUrl()}/?reset-email=${encodeURIComponent(email)}`
    );
};

export const verifyEmailFromLink = async (req, res) => {
    const appUrl = getFrontendUrl();
    try {
        const email = req.query.email;
        if (!email) {
            return res.status(400).type("html").send(`
                <html><body style="font-family:sans-serif;text-align:center;padding:40px;">
                    <h2>Verification failed</h2>
                    <p>Invalid or missing email in the link.</p>
                    <a href="${escapeHtml(appUrl)}">Go to Trackly</a>
                </body></html>
            `);
        }

        const user = await User.findOneAndUpdate(
            { email },
            { verified: true },
            { new: true }
        );
        if (!user) {
            return res.status(404).type("html").send(`
                <html><body style="font-family:sans-serif;text-align:center;padding:40px;">
                    <h2>Account not found</h2>
                    <p>Please sign up again.</p>
                    <a href="${escapeHtml(appUrl)}">Go to Trackly</a>
                </body></html>
            `);
        }

        return res.type("html").send(`
            <html><body style="font-family:sans-serif;text-align:center;padding:40px;">
                <h2 style="color:#15803d;">Email verified!</h2>
                <p>Your account is verified. You can sign in now.</p>
                <a href="${escapeHtml(appUrl)}" style="display:inline-block;margin-top:12px;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Go to Trackly</a>
            </body></html>
        `);
    } catch (error) {
        return res.status(500).type("html").send(`
            <html><body style="font-family:sans-serif;text-align:center;padding:40px;">
                <h2>Verification failed</h2>
                <p>Please try again or contact support.</p>
                <a href="${escapeHtml(appUrl)}">Go to Trackly</a>
            </body></html>
        `);
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.json(sanitizeUser(user));
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

export const refreshSession = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token missing" });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        if (decoded.type !== "refresh") {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        setAuthCookies(res, user);
        return res.status(200).json({ user: sanitizeUser(user) });
    } catch (error) {
        clearAuthCookies(res);
        return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
};

export const logout = async (req, res) => {
    clearAuthCookies(res);
    return res.status(200).json({ message: "Logged out successfully" });
};

export const updatePassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.password = await bcrypt.hash(password, 10);
        await user.save();

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

        const emailStatus = await sendForgotPasswordEmail(email, user.userName);
        return res.status(201).json({ message: "Email sent for verification", email: emailStatus });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

const sendForgotPasswordEmail = (toEmail, userName) => {
    const resetLink = `${getBackendUrl()}/user/reset-link?email=${encodeURIComponent(toEmail)}`;

    return sendMail({
        to: toEmail,
        subject: "Forgot Password",
        html: `<div>
            <h1>Trackly</h1>
            <h4>Dear ${userName},</h4>
            <p>Click the button below to reset your password:</p>
            <a href="${resetLink}" style="display:inline-block;background-color:blue;width:200px;height:60px;line-height:60px;text-align:center;color:white;text-decoration:none;font-weight:bold;border-radius:5px;">
                Reset Password
            </a>
            <p>If this wasn't you, please ignore this email.</p>
            <h6>Thanks & Regards</h6><b>Trackly App Team</b>
        </div>`,
    });
};
