import mongoose from 'mongoose';

// Define EmergencyContact Schema
const emergencyContactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        return !v || /^\S+@\S+\.\S+$/.test(v); // allow null or valid email
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  deletedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

// Soft delete filter
emergencyContactSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null });
  next();
});

// Create and export the model
const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);
export default EmergencyContact;
