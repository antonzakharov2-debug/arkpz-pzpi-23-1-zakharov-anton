const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seedAdmin() {
  await mongoose.connect("mongodb://127.0.0.1:27017/farm_enviro");
  const email = "admin@admin.com";
  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin already exists");
    process.exit();
  }
  const hash = await bcrypt.hash("admin123", 10);
  await User.create({
    email,
    password: hash,
    firstName: "Admin",
    lastName: "User",
    phone: "0000000000",
    birthDate: new Date("1990-01-01"),
    role: "admin",
    farms: []
  });
  console.log("Admin created: admin@admin.com / admin123");
  process.exit();
}
seedAdmin();
