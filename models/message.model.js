import mongoose from 'mongoose';

// Define Message Schema
const messageSchema = new mongoose.Schema({
  familyGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyGroup', // Assumes there's a FamilyGroup model
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messageText: {
    type: String,
    required: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

// Middleware to auto-exclude soft-deleted messages
messageSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null });
  next();
});

// Create and export the model
const Message = mongoose.model('Message', messageSchema);
export default Message;
