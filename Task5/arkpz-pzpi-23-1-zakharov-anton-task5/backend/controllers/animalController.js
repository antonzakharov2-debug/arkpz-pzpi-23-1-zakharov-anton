const Animal = require("../models/Animal");
const Farm = require("../models/Farm");
const Notification = require("../models/Notification");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.addAnimal = async (req, res) => {
  const { animalNumber, species, gender, farmId, tagNumber, state, activity, age } = req.body;

  const farm = await Farm.findById(farmId);
  if (!farm) {
    return res.status(404).json({ message: "Farm not found" });
  }

  // Check by animalNumber first
  const existsNumber = await Animal.findOne({ animalNumber });
  if (existsNumber) {
    return res.status(400).json({ message: "Animal with this number already exists" });
  }

  // If tagNumber provided, check uniqueness
  if (tagNumber) {
    const existsTag = await Animal.findOne({ tagNumber });
    if (existsTag) {
      return res.status(400).json({ message: "tagNumber is already in use" });
    }
  }

  const animalData = {
    animalNumber,
    species,
    gender,
    farm: farm._id
  };
  if (tagNumber) animalData.tagNumber = tagNumber;
  if (state) animalData.state = state;
  if (activity) animalData.activity = activity;
  if (typeof age !== "undefined") animalData.age = Number(age);

  const animal = new Animal(animalData);

  try {
    await animal.save();
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.tagNumber) {
        return res.status(400).json({ message: "tagNumber is already in use" });
      }
      if (err.keyPattern && err.keyPattern.animalNumber) {
        return res.status(400).json({ message: "animalNumber already exists" });
      }
    }
    return res.status(500).json({ message: "Error creating animal", error: err.message });
  }

  farm.animals.push(animal._id);
  farm.animalsCount = farm.animals.length;
  await farm.save();

  // If state indicates problem, create notification for all users of this farm
  try {
    if (animal.state === "bad" && !animal.notified) {
      const recommendations = [
        "Check water supply and ensure fresh clean water is available.",
        "Inspect feed quality and adjust nutrition; consider veterinary check.",
        "Check shelter/temperature conditions; improve ventilation or heating.",
        "Isolate the animal and perform basic health inspection; call veterinarian if needed.",
        "Increase monitoring frequency and record symptoms for analysis.",
        "Review vaccination and deworming schedule; update if overdue."
      ];

      const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
      const message = `Animal #${animal.animalNumber} (${animal.species}) on farm "${farm.name}" reported status "bad". Recommendation: ${rec}`;

      // select only users that explicitly reference this farm id (pass id as-is)
      const users = await User.find({ farms: farm._id }).select("_id").lean();

      const recipients = users.map(u => u._id);

      if (!recipients || recipients.length === 0) {
        console.log(`No users subscribed to farm ${farm._id} — skipping notification for animal ${animal._id}`);
      } else {
        const notif = new Notification({
          message,
          farm: farm._id,
          animal: animal._id,
          recommendation: rec,
          recipients
        });
        await notif.save();

        // mark animal as notified to avoid duplicate notifications
        animal.notified = true;
        await animal.save();
        console.log(`Notification created for farm ${farm._id}, animal ${animal._id}`);
      }
    }
  } catch (notifErr) {
    console.error("Notification error:", notifErr);
  }

  res.json({
    message: "Animal added successfully",
    animal
  });
};

// searchAnimals unchanged
exports.searchAnimals = async (req, res) => {
  try {
    const { animalNumber, species, state, activity, farm, age } = req.query;
    const filter = {};

    if (animalNumber) filter.animalNumber = Number(animalNumber);
    if (species) filter.species = species;
    if (state) filter.state = state;
    if (activity) filter.activity = activity;
    if (farm) filter.farm = farm;
    if (typeof age !== "undefined" && age !== "") filter.age = Number(age);

    const animals = await Animal.find(filter).populate("farm").limit(200);
    res.json(animals);
  } catch (err) {
    res.status(500).json({ message: "Error searching animals", error: err.message });
  }
};

exports.getAnimalById = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id).populate("farm");
    if (!animal) return res.status(404).json({ message: "Animal not found" });
    res.json(animal);
  } catch (err) {
    res.status(500).json({ message: "Error fetching animal", error: err.message });
  }
};

exports.updateAnimal = async (req, res) => {
  try {
    const updates = {};
    const allowed = ["species","gender","age","state","activity","tagNumber"];
    allowed.forEach(k => {
      if (typeof req.body[k] !== "undefined") updates[k] = req.body[k];
    });

    const animal = await Animal.findById(req.params.id);
    if (!animal) return res.status(404).json({ message: "Animal not found" });

    // apply updates
    Object.assign(animal, updates);
    await animal.save();

    // if became 'bad' and not notified -> create notification (same logic as add)
    if (animal.state === "bad" && !animal.notified) {
      const farm = await Farm.findById(animal.farm).select("name");
      const recommendations = [
        "Check water supply and ensure fresh clean water is available.",
        "Inspect feed quality and adjust nutrition; consider veterinary check.",
        "Check shelter/temperature conditions; improve ventilation or heating.",
        "Isolate the animal and perform basic health inspection; call veterinarian if needed.",
        "Increase monitoring frequency and record symptoms for analysis.",
        "Review vaccination and deworming schedule; update if overdue."
      ];
      const rec = recommendations[Math.floor(Math.random()*recommendations.length)];
      const message = `Animal #${animal.animalNumber} (${animal.species}) on farm "${farm ? farm.name : animal.farm}" reported status "bad". Recommendation: ${rec}`;
      const users = await User.find({ farms: animal.farm }).select("_id").lean();
      const recipients = users.map(u => u._id);
      if (recipients.length > 0) {
        await Notification.create({ message, farm: animal.farm, animal: animal._id, recommendation: rec, recipients });
        animal.notified = true;
        await animal.save();
      } else {
        console.log(`No subscribers for farm ${animal.farm} — skip notification`);
      }
    }

    res.json({ message: "Animal updated", animal });
  } catch (err) {
    res.status(500).json({ message: "Error updating animal", error: err.message });
  }
};

exports.deleteAnimal = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) return res.status(404).json({ message: "Animal not found" });

    // remove reference from farm
    if (animal.farm) {
      await Farm.updateOne({ _id: animal.farm }, { $pull: { animals: animal._id } });
      // recalc animalsCount
      const farm = await Farm.findById(animal.farm);
      if (farm) {
        farm.animalsCount = farm.animals ? farm.animals.length : 0;
        await farm.save();
      }
    }

    await Notification.deleteMany({ animal: animal._id }).catch(()=>{});
    await animal.deleteOne();

    res.json({ message: "Animal deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting animal", error: err.message });
  }
};