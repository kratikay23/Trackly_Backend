import mongoose from 'mongoose';

// Schema Definition
const sosAlertSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  emgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyContact',
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  alertMessage: {
    type: String,
    required: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Middleware to automatically exclude soft-deleted records
sosAlertSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null });
  next();
});

// Export Model
const SOSalert = mongoose.model('SOSalert', sosAlertSchema);
export default SOSalert;
