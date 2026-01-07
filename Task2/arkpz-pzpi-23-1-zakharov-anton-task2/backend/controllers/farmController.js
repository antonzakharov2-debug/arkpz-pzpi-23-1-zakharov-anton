const Farm = require("../models/Farm");
const Animal = require("../models/Animal");
const Notification = require("../models/Notification");
const User = require("../models/User");

exports.getFarms = async (req, res) => {
  const farms = await Farm.find();
  res.json(farms);
};

exports.getFarmDetails = async (req, res) => {
  const farm = await Farm.findById(req.params.id).populate("animals");
  if (!farm) return res.status(404).json({ message: "Farm not found" });
  res.json(farm);
};

exports.updateFarm = async (req, res) => {
  try {
    const updates = {};
    const allowed = ["name", "location", "owner"];
    allowed.forEach((k) => {
      if (typeof req.body[k] !== "undefined") updates[k] = req.body[k];
    });

    const farm = await Farm.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!farm) return res.status(404).json({ message: "Farm not found" });
    res.json({ message: "Farm updated", farm });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating farm", error: err.message });
  }
};

exports.deleteFarm = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) return res.status(404).json({ message: "Farm not found" });

    // delete animals and their notifications
    await Animal.deleteMany({ farm: farm._id });
    await Notification.deleteMany({ farm: farm._id });

    // remove farm reference from users
    await User.updateMany({ farms: farm._id }, { $pull: { farms: farm._id } });

    await farm.deleteOne();

    res.json({ message: "Farm deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting farm", error: err.message });
  }
};