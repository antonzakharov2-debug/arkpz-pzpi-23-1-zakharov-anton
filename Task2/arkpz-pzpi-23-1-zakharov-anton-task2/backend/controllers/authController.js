const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Farm = require("../models/Farm");
const Animal = require("../models/Animal");
const Notification = require("../models/Notification");

// REGISTER
exports.register = async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    birthDate,
    role,
    farmId
  } = req.body;

  // Проверка на существующего пользователя
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({
      message: "User with this email already exists. Please login."
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phone,
    birthDate,
    role
  });

  await user.save();

  let farm;
  if (farmId) {
    farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(400).json({ message: "Selected farm not found" });
    }
    // если у фермы ещё нет владельца — назначаем
    if (!farm.owner) {
      farm.owner = user._id;
      await farm.save();
    }
    user.farms = [farm._id];
    await user.save();
  } else {
    // иначе — создаём новую ферму и 5 дефолтных тварин
    farm = new Farm({
      name: `${firstName}'s Farm`,
      location: "",
      owner: user._id,
      animals: [],
      animalsCount: 0
    });

    const defaultSpecies = ["Cow", "Chicken", "Pig", "Sheep", "Goat"];

    for (let i = 0; i < defaultSpecies.length; i++) {
      const uniqueNumber = Date.now() + i + Math.floor(Math.random() * 1000);
      const animal = new Animal({
        animalNumber: uniqueNumber,
        species: defaultSpecies[i],
        gender: "Самка",
        farm: farm._id
        // state и activity возьмут значения по умолчанию из схемы
      });
      await animal.save();
      farm.animals.push(animal._id);
    }

    farm.animalsCount = farm.animals.length;
    await farm.save();

    user.farms = [farm._id];
    await user.save();
  }

  // получить фермы пользователя с populated animals
  const farms = await Farm.find({ _id: { $in: user.farms } }).populate("animals");

  const mappedFarms = farms.map(f => ({
    _id: f._id,
    name: f.name,
    animalsCount: f.animalsCount,
    animals: (f.animals || []).map(a => ({
      _id: a._id,
      animalNumber: a.animalNumber,
      species: a.species,
      gender: a.gender,
      state: a.state,
      activity: a.activity
    }))
  }));

  res.json({
    message: farmId ? "User registered and joined existing farm" : "User registered successfully",
    user: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      birthDate: user.birthDate,
      role: user.role,
      farms: mappedFarms
    }
  });
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Wrong password" });
  }

  // Получаем фермы пользователя с populated animals
  let farms = [];
  if (user.farms && user.farms.length > 0) {
    // если уже refs
    if (typeof user.farms[0] === "object" && user.farms[0].name) {
      farms = user.farms;
    } else {
      farms = await Farm.find({ _id: { $in: user.farms } }).populate("animals");
    }
  }

  const mappedFarms = farms.map(f => ({
    _id: f._id,
    name: f.name,
    animalsCount: f.animalsCount,
    animals: (f.animals || []).map(a => ({
      _id: a._id,
      animalNumber: a.animalNumber,
      species: a.species,
      gender: a.gender,
      state: a.state,
      activity: a.activity
    }))
  }));

  res.json({
    message: "Login successful",
    user: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      birthDate: user.birthDate,
      role: user.role,
      farms: mappedFarms
    }
  });
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const allowed = ["firstName", "lastName", "phone", "birthDate", "role", "password"];
    const updates = {};
    for (const k of allowed) {
      if (typeof req.body[k] !== "undefined") updates[k] = req.body[k];
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(String(updates.password), 10);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    // populate farms for response if any
    const farms = user.farms && user.farms.length
      ? await Farm.find({ _id: { $in: user.farms } })
      : [];

    const mappedFarms = farms.map(f => ({
      _id: f._id,
      name: f.name,
      animalsCount: f.animalsCount
    }));

    res.json({
      message: "User updated",
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        birthDate: user.birthDate,
        role: user.role,
        farms: mappedFarms
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // For farms owned by this user -> unset owner
    await Farm.updateMany({ owner: user._id }, { $unset: { owner: "" } });

    // remove user from notification recipients/readBy
    await Notification.updateMany({}, { $pull: { recipients: user._id, readBy: user._id } });

    // finally delete user
    await user.deleteOne();

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
};