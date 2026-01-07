const mongoose = require("mongoose");

const farmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  // farm owner reference (optional for existing records)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  animals: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal"
    }
  ],
  animalsCount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Farm", farmSchema);