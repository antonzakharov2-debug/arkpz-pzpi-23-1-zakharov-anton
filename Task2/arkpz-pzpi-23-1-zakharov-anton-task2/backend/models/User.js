const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  firstName: {
    type: String,
    required: true
  },

  lastName: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  birthDate: {
    type: Date,
    required: true
  },

  role: {
    type: String,
    enum: ["farmer", "worker", "admin"],
    default: "farmer"
  },

  // stores references to user's farms
  farms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farm"
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);