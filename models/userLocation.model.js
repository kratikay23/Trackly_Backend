import mongoose from 'mongoose';

const userLocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // assuming reference to User collection
    ref: 'User',
    required: true,
    unique: true
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

const UserLocation = mongoose.model('UserLocation', userLocationSchema);
export default UserLocation;
