import mongoose from 'mongoose';

// Define FamilyGroup Schema
const familyGroupSchema = new mongoose.Schema({
  familyID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family', // Assuming there's a Family model; otherwise use String
    required: true,
  },
  groupName: {
    type: String,
    required: true,
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

// Create and export the model
const FamilyGroup = mongoose.model('FamilyGroup', familyGroupSchema);
export default FamilyGroup;
