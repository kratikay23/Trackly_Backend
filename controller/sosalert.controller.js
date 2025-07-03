import SOSalert from "../models/sosAlert.model.js";
import EmergencyContact from "../models/EmergencyContact.model.js"
import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const triggerSOS = async (req, res) => {
  try {
    const { latitude, longitude, alertMessage, emgId } = req.body;
    const userID = req.user._id;

    const user = await User.findById(userID);
    const userName = user?.userName || "Your contact";

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location required" });
    }

    if (!emgId) {
      return res.status(401).json({ message: "Add emergency contact" });
    }

    // Save SOS Alert
    const result = await SOSalert.create({
      userID,
      emgId,
      latitude,
      longitude,
      alertMessage,
    });

    // Respond immediately to client
    res.status(201).json({
      message: "SOS Alert Triggered. You can cancel within 10 seconds.",
      sosAlert: result,
    });

    // Wait 5 seconds before sending alert (to allow cancellation)
    setTimeout(async () => {
      const latestSOS = await SOSalert.findById(result._id).lean();
      if (latestSOS) {
        console.log("Sending alert to emergency contacts...");

        const emergencyContact = await EmergencyContact.findById(emgId);
        if (!emergencyContact || !emergencyContact.email) {
          console.log("❌ No email found for emergency contact.");
          return;
        }

        const emailStatus = await sendEmail(
          emergencyContact.email,
          emergencyContact.name,
          userName,
          latitude,
          longitude,
          alertMessage
        );

        if (!emailStatus) {
          console.log("❌ Failed to send email");
        } else {
          console.log("✅ Email sent to emergency contact", userName);
        }
      } else {
        console.log("SOS alert was cancelled or deleted.");
      }
    }, 5000);
  } catch (error) {
    console.error("Trigger SOS Error:", error);
    return res.status(500).json({ error: "Failed to trigger SOS" });
  }
};

const sendEmail = (toEmail, toName, fromName, atLatitude, atLongitude, alertMessage) => {
  return new Promise((resolve, reject) => {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PASSWORD
      }
    });

    let mapLink = `https://www.google.com/maps?q=${atLatitude},${atLongitude}`;

    let mailOption = {
      from: process.env.GMAIL_ID,
      to: toEmail,
      subject: 'SOS Alert – Immediate Attention Needed!',
      html: `
        <h4>Dear ${toName},</h4>
        <p><b>${fromName}</b> has triggered an SOS alert and may be in danger.</p>
        <p><strong>Location:</strong> <a href="${mapLink}" target="_blank">View on Map</a></p>
        <p><strong>Message:</strong> ${alertMessage}</p>
        <br />
        <p>Please take immediate action if necessary.</p>
        <hr />
        <p><i>Trackly App | Powered by Kratika Yadav</i></p>`
    };

    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
        reject(false);
      } else {
        resolve(true);
      }
    });
  });
};
