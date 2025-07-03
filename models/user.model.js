import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  contactNo: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^\S+@\S+\.\S+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  password: {
    type: String,
    required: true,
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to another collection if needed
    ref: 'Family',
    default: null,
  },
  role: {
    type: String,
    enum: ['Head', 'Member'],
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  authProvider: {
    type: String,
    required: true,
    default: 'email', // or 'google'
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);
export default User;
