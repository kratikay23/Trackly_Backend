import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const sendMessage = async (req, res) => {
  try {
    const { familyGroupId, messageText } = req.body;
    const senderId = req.user.userId;

    if (!familyGroupId || !senderId || !messageText) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newMessage = await Message.create({
      familyGroupId,
      senderId,
      messageText,
    });

    return res.status(200).json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to send message" });
  }
};

export const fetchMessage = async (req, res) => {
  try {
    const { familyGroupId } = req.params;

    const messages = await Message.find({ familyGroupId })
      .sort({ createdAt: 1 })
      .populate("senderId", "userId userName email");

    return res.status(200).json({ message: "Messages fetched successfully", data: messages });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to get messages" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { msgId } = req.body;
    const userId = req.user.userId;

    const message = await Message.findById(msgId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can delete only your own message" });
    }

    await Message.findByIdAndDelete(msgId);
    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to delete message" });
  }
};
