import Family from "../models/Family.model.js";
import User from "../models/user.model.js";

export const addFamily = async (req, res) => {
  try {
    const { familyName } = req.body;
    const headId = req.user._id;

    const existing = await Family.findOne({ headId });
    if (existing) {
      return res.status(400).json({ message: "Family already created" });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const familyID = `${familyName}${randomNum}`;

    const newFamily = await Family.create({ familyName, headId, familyID });

    await User.findByIdAndUpdate(headId, {
      familyId: newFamily._id,
      role: "Head"
    });

    return res.status(200).json({ message: "Family created successfully" });
  } catch (error) {
    console.error("Add family error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const fetchFamily = async (req, res) => {
  try {
    // 1. Get the current user from DB using req.user.userId
    const user = await User.findById(req.user._id);
    console.log("User fetched:", user); // 👈 log this


    if (!user || !user.familyId) {
      return res.status(404).json({ message: "Family not found" });
    }

    // 2. Get the family document
    const family = await Family.findById(user.familyId).lean();

    // 3. Get all users that belong to this family
    const members = await User.find({ familyId: user.familyId }).select("userName email role _id");

    // 4. Combine and send
    console.log(user, family, members)

    res.status(200).json({ family: { ...family, members }, role: user.role });
  } catch (error) {
    console.error("Fetch family error:", error);
    return res.status(500).json({ error: "Failed to fetch family" });
  }
};


export const addMembers = async (req, res) => {
  try {
    const headId = req.user._id;
    const { memberEmail } = req.body;

    const headUser = await User.findById(headId);
    if (!headUser || !headUser.familyId) {
      return res.status(403).json({ message: "No family found for head" });
    }

    const familyData = await Family.findById(headUser.familyId);
    if (!familyData || String(familyData.headId) !== String(headId)) {
      return res.status(403).json({ message: "Only the head can add members" });
    }

    const member = await User.findOne({ email: memberEmail });
    if (!member) return res.status(404).json({ message: "User not found" });
    if (member.familyId) return res.status(403).json({ message: "User already in a family" });

    member.familyId = familyData._id;
    member.role = "Member";
    await member.save();

    return res.status(200).json({ message: "Member added to family" });
  } catch (error) {
    console.error("Add member error:", error);
    return res.status(500).json({ error: "Failed to add member" });
  }
};

export const removeMember = async (req, res) => {
  try {
    const headId = req.user._id;
    const { memberId } = req.body;

    const headUser = await User.findById(headId);
    if (!headUser || headUser.role !== "Head" || !headUser.familyId) {
      return res.status(403).json({ message: "Only Head can remove members" });
    }

    const member = await User.findById(memberId);
    if (
      !member ||
      String(member.familyId) !== String(headUser.familyId) ||
      member.role !== "Member"
    ) {
      return res.status(404).json({ message: "Member not found in your family" });
    }

    member.familyId = null;
    member.role = null;
    await member.save();

    return res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    return res.status(500).json({ error: "Failed to remove member" });
  }
};

export const leaveFamily = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "Member" || !user.familyId) {
      return res.status(403).json({ message: "Only members can leave family" });
    }

    user.familyId = null;
    user.role = null;
    await user.save();

    return res.status(200).json({ message: "Left family successfully" });
  } catch (error) {
    console.error("Leave family error:", error);
    return res.status(500).json({ error: "Failed to leave family" });
  }
};

export const changeFamilyName = async (req, res) => {
  try {
    const headId = req.user.userId;
    const { newFamilyName } = req.body;

    const headUser = await User.findById(headId);
    if (!headUser || headUser.role !== "Head" || !headUser.familyId) {
      return res.status(403).json({ message: "Only Head can change family name" });
    }

    const familyData = await Family.findById(headUser.familyId);
    if (!familyData) return res.status(404).json({ message: "Family not found" });

    familyData.familyName = newFamilyName;
    await familyData.save();

    return res.status(200).json({ message: "Family name updated", familyData });
  } catch (error) {
    console.error("Change family name error:", error);
    return res.status(500).json({ error: "Failed to update family name" });
  }
};

export const joinFamilyByCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { familyCode } = req.body;

    if (user.familyId) {
      return res.status(400).json({ message: "Already part of a family" });
    }

    const familyData = await Family.findOne({ familyID: familyCode });
    if (!familyData) {
      return res.status(404).json({ message: "Invalid family code" });
    }

    user.familyId = familyData._id;
    user.role = "Member";
    await user.save();

    return res.status(200).json({ message: "Joined family successfully" });
  } catch (error) {
    console.error("Join family error:", error);
    return res.status(500).json({ error: "Failed to join family" });
  }
};

export const transferheadRole = async (req, res) => {
  try {
    const currentHeadId = req.user.userId;
    const { newHeadUserId } = req.body;

    const currentHead = await User.findById(currentHeadId);
    const newHead = await User.findById(newHeadUserId);
    const familyData = await Family.findOne({ headId: currentHeadId });

    if (!familyData) {
      return res.status(403).json({ message: "Only Head can transfer role" });
    }

    if (String(newHead.familyId) !== String(familyData._id)) {
      return res.status(400).json({ message: "User is not in the same family" });
    }

    currentHead.role = "Member";
    newHead.role = "Head";
    familyData.headId = newHeadUserId;

    await currentHead.save();
    await newHead.save();
    await familyData.save();

    return res.status(200).json({ message: "Head role transferred" });
  } catch (error) {
    console.error("Transfer role error:", error);
    return res.status(500).json({ error: "Failed to transfer role" });
  }
};

export const deleteFamily = async (req, res) => {
  try {
    const headId = req.user._id;
    const user = await User.findById(headId);
    const familyData = await Family.findById(user.familyId);

    if (!familyData || String(familyData.headId) !== String(headId)) {
      return res.status(403).json({ message: "Only Head can delete family" });
    }

    await User.updateMany({ familyId: familyData._id }, { familyId: null, role: null });
    await Family.findByIdAndDelete(familyData._id);

    return res.status(200).json({ message: "Family deleted successfully" });
  } catch (error) {
    console.error("Delete family error:", error);
    return res.status(500).json({ error: "Failed to delete family" });
  }
};
