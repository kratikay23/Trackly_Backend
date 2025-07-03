import mongoose from 'mongoose';

// Define Family Schema
const familySchema = new mongoose.Schema({
  familyName: {
    type: String,
    default: null,
  },
  familyID: {
    type: String,
    unique: true,
    default: null,
  },
  headId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

// Middleware to exclude soft-deleted documents
familySchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null });
  next();
});

// Create and export the model
const Family = mongoose.model('Family', familySchema);
export default Family;
