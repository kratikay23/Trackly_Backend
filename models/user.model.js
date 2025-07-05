import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  contactNo: {
    type: String,
    required: function () {
      return this.authProvider === "email"; // ✅ only required for email users
    },
  },

  password: {
    type: String,
    required: function () {
      return this.authProvider === "email"; // ✅ only required for email users
    },
  },

  authProvider: {
    type: String,
    enum: ["email", "google"],
    default: "email",
  },

  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family",
  },

  role: {
    type: String,
  },

  verified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });


const User = mongoose.model('User', userSchema);
export default User;
