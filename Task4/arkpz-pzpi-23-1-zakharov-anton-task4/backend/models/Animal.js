const mongoose = require("mongoose");

const animalSchema = new mongoose.Schema({
  animalNumber: {
    type: Number,
    required: true,
    unique: true
  },

  species: {
    type: String,
    enum: ["Cow", "Chicken", "Pig", "Sheep", "Goat"],
    required: true
  },

  gender: {
    type: String,
    enum: ["Female", "Male"],
    required: true
  },

  // age in years
  age: {
    type: Number,
    min: 0,
    default: 0
  },

  state: {
    type: String,
    enum: ["good", "normal", "bad"],
    default: "normal"
  },

  activity: {
    type: String,
    enum: ["eating", "sleeping", "walking", "resting", "drinking"],
    default: "resting"
  },

  // optional tag identifier — do not set null explicitly, so partial index works correctly
  tagNumber: {
    type: String
  },

  // flag to avoid duplicate notifications when state is changed in DB
  notified: {
    type: Boolean,
    default: false
  },

  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farm",
    required: true
  }
});

// tagNumber uniqueness only if present (partial index)
animalSchema.index(
  { tagNumber: 1 },
  { unique: true, partialFilterExpression: { tagNumber: { $exists: true, $ne: null } } }
);

module.exports = mongoose.model("Animal", animalSchema);