import SOSalert from "../models/sosAlert.model.js";
import EmergencyContact from "../models/EmergencyContact.model.js";
import User from "../models/user.model.js";
import { sendMail } from "../utils/mailer.js";

const sendSosEmail = (toEmail, toName, fromName, atLatitude, atLongitude, alertMessage) => {
    const mapLink = `https://www.google.com/maps?q=${atLatitude},${atLongitude}`;

    return sendMail({
        to: toEmail,
        subject: "SOS Alert – Immediate Attention Needed!",
        html: `
            <h4>Dear ${toName},</h4>
            <p><b>${fromName}</b> has triggered an SOS alert and may be in danger.</p>
            <p><strong>Location:</strong> <a href="${mapLink}" target="_blank">View on Map</a></p>
            <p><strong>Message:</strong> ${alertMessage}</p>
            <br />
            <p>Please take immediate action if necessary.</p>
            <hr />
            <p><i>Trackly App Team</i></p>`,
    });
};

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

        const result = await SOSalert.create({
            userID,
            emgId,
            latitude,
            longitude,
            alertMessage,
        });

        res.status(201).json({
            message: "SOS Alert Triggered. You can cancel within 10 seconds.",
            sosAlert: result,
        });

        setTimeout(async () => {
            try {
                const latestSOS = await SOSalert.findById(result._id).lean();
                if (!latestSOS) return;

                const emergencyContact = await EmergencyContact.findById(emgId);
                if (!emergencyContact?.email) return;

                await sendSosEmail(
                    emergencyContact.email,
                    emergencyContact.name,
                    userName,
                    latitude,
                    longitude,
                    alertMessage
                );
            } catch (emailError) {
            }
        }, 5000);
    } catch (error) {
        return res.status(500).json({ error: "Failed to trigger SOS" });
    }
};
