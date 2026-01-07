const router = require("express").Router();
const User = require("../models/User");
const Animal = require("../models/Animal");
const Farm = require("../models/Farm");
const Notification = require("../models/Notification");
const admin = require("../middleware/admin");

// Для простоти: req.user має бути заповнений (JWT або інший спосіб)
router.use(admin);

// USERS
router.get("/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});
router.post("/users", async (req, res) => {
  // Додаємо користувача (без пароля, тільки для тесту)
  res.status(501).json({ message: "Use /auth/register for user creation" });
});
router.put("/users/:id", async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});
router.delete("/users/:id", async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deleted" });
});

// ANIMALS
router.get("/animals", async (req, res) => {
  const animals = await Animal.find().populate("farm");
  res.json(animals);
});
router.post("/animals", async (req, res) => {
  const animal = new Animal(req.body);
  await animal.save();
  res.json(animal);
});
router.put("/animals/:id", async (req, res) => {
  const animal = await Animal.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!animal) return res.status(404).json({ message: "Animal not found" });
  res.json(animal);
});
router.delete("/animals/:id", async (req, res) => {
  const animal = await Animal.findByIdAndDelete(req.params.id);
  if (!animal) return res.status(404).json({ message: "Animal not found" });
  res.json({ message: "Animal deleted" });
});

// FARMS
router.get("/farms", async (req, res) => {
  const farms = await Farm.find();
  res.json(farms);
});
router.post("/farms", async (req, res) => {
  const farm = new Farm(req.body);
  await farm.save();
  res.json(farm);
});
router.put("/farms/:id", async (req, res) => {
  const farm = await Farm.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!farm) return res.status(404).json({ message: "Farm not found" });
  res.json(farm);
});
router.delete("/farms/:id", async (req, res) => {
  const farm = await Farm.findByIdAndDelete(req.params.id);
  if (!farm) return res.status(404).json({ message: "Farm not found" });
  res.json({ message: "Farm deleted" });
});

// NOTIFICATIONS
router.get("/notifications", async (req, res) => {
  const notifs = await Notification.find().populate("farm animal recipients");
  res.json(notifs);
});
router.post("/notifications", async (req, res) => {
  const notif = new Notification(req.body);
  await notif.save();
  res.json(notif);
});
router.delete("/notifications/:id", async (req, res) => {
  const notif = await Notification.findByIdAndDelete(req.params.id);
  if (!notif) return res.status(404).json({ message: "Notification not found" });
  res.json({ message: "Notification deleted" });
});

module.exports = router;
