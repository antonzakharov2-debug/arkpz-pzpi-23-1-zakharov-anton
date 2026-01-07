const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Notification",
  new mongoose.Schema({
    message: { type: String, required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },
    animal: { type: mongoose.Schema.Types.ObjectId, ref: "Animal" },
    recommendation: { type: String },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // users who marked this notification as read
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now }
  })
);