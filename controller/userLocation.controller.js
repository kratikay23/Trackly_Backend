import UserLocation from "../models/userLocation.model.js";
import User from "../models/user.model.js";

export const userLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user._id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude and Longitude required" });
    }

    const updated = await UserLocation.findOneAndUpdate(
      { userId },
      { latitude, longitude },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: "Location updated", location: updated });
  } catch (err) {
    console.log("Location update error:", err);
    return res.status(500).json({ error: "Failed to update location" });
  }
};

export const fetchFamilyLocations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.familyId) {
      return res.status(403).json({ message: "User not in a family" });
    }

    // Step 1: Get all family member _ids
    const members = await User.find({ familyId: user.familyId }).select("_id");

    const memberIds = members.map(m => m._id);

    // Step 2: Get all locations with user populated
    const locations = await UserLocation.find({ userId: { $in: memberIds } })
      .populate({
        path: "userId",
        select: "userName email role"
      });

    // Step 3: Format the response
    const formatted = locations.map(loc => ({
      _id: loc.userId._id,
      userName: loc.userId.userName,
      email: loc.userId.email,
      role: loc.userId.role,
      UserLocation: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        updatedAt: loc.updatedAt
      }
    }));

    return res.status(200).json({ members: formatted });

  } catch (err) {
    console.log("Fetch family location error:", err);
    return res.status(500).json({ error: "Failed to fetch family locations" });
  }
};

