import Family from "../models/Family.model.js";
import FamilyGroup from "../models/FamilyGroup.model.js";
import User from "../models/user.model.js";


export const createFamilyGroup = async (req, res) => {
  try {
    const { familyID: familyCode, groupName } = req.body;

    if (!familyCode || !groupName) {
      return res.status(400).json({ error: "Family ID and group name are required" });
    }

    // First, find the family document by familyID (which is a string like "fam7248")
    const family = await Family.findOne({ familyID: familyCode });
    if (!family) {
      return res.status(404).json({ error: "Invalid family ID" });
    }

    // Use the actual ObjectId for all future lookups
    const existingGroup = await FamilyGroup.findOne({ familyID: family._id });
    if (existingGroup) {
      return res.status(400).json({ message: "Group already exists for this family" });
    }

    const newGroup = await FamilyGroup.create({
      familyID: family._id,
      groupName,
    });

    // Optional: If you want to return members
    const groupMembers = await Family.findById(family._id).populate({
      path: "members",
      select: "userId userName email role",
    });

    return res.status(200).json({
      message: "Family group created successfully",
      group: {
        groupInfo: newGroup,
        family: groupMembers,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to create family group" });
  }
};

export const fetchFamilyGroup = async (req, res) => {
  try {
    const { famgroupId } = req.params; // This is the string code like "fam7248"

    // First find the family by its familyID (string code)
    const family = await Family.findOne({ familyID: famgroupId });
    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }

    // Now find the group using the _id of the found family
    const group = await FamilyGroup.findOne({ familyID: family._id });
    if (!group) {
      return res.status(404).json({ error: "Family group not found" });
    }

    return res.status(200).json({
      message: "Family group retrieved successfully",
      result: group,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to get family group" });
  }
};
