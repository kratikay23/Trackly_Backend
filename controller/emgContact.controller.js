import EmergencyContact from "../models/EmergencyContact.model.js";

// Add a new emergency contact
export const addEmgContacts = async (req, res) => {
  try {
    const { name, contactNumber, email } = req.body;
    const userId = req.user._id;

    const existingContact = await EmergencyContact.findOne({ userId, contactNumber });
    if (existingContact) {
      return res.status(400).json({ message: "Contact already exists." });
    }

    const newContact = new EmergencyContact({
      userId,
      name,
      contactNumber,
      email,
    });

    await newContact.save();

    return res.status(201).json({ message: "Emergency Contact added", contact: newContact });
  } catch (error) {
    console.error("Error adding contact:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Fetch all emergency contacts for the current user
export const fetchEmgContact = async (req, res) => {
  try {
    const userId = req.user._id;

    const contacts = await EmergencyContact.find({ userId });

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Update an emergency contact
export const updateEmgContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;
    const { name, contactNumber, email } = req.body;

    const contact = await EmergencyContact.findOne({ _id: contactId, userId });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    contact.name = name || contact.name;
    contact.contactNumber = contactNumber || contact.contactNumber;
    contact.email = email || contact.email;

    await contact.save();

    return res.status(200).json({ message: "Contact updated", contact });
  } catch (error) {
    console.error("Error updating contact:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Delete an emergency contact
export const deleteEmgContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;

    const contact = await EmergencyContact.findOneAndDelete({ _id: contactId, userId });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    return res.status(200).json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
