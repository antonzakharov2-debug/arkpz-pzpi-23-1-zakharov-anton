const mongoose = require("mongoose");
const Farm = require("../models/Farm");

mongoose.connect("mongodb://localhost:27017/farm_enviro");

const farms = [
  { name: "Green Valley Farm", location: "Kyiv region" },
  { name: "Sunny Field Farm", location: "Lviv region" },
  { name: "River Side Farm", location: "Poltava region" },
  { name: "Highland Farm", location: "Ivano-Frankivsk region" },
  { name: "Steppe Farm", location: "Kherson region" }
];

async function seed() {
  await Farm.deleteMany();
  await Farm.insertMany(farms);
  console.log("5 farms created");
  process.exit();
}

seed();