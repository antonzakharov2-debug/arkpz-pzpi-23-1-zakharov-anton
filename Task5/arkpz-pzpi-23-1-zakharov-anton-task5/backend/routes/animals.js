const express = require("express");
const router = express.Router();
const animalController = require("../controllers/animalController");

router.get("/", animalController.searchAnimals);
router.post("/add", animalController.addAnimal);

// get/update/delete by id
router.get("/:id", animalController.getAnimalById);
router.put("/:id", animalController.updateAnimal);
router.delete("/:id", animalController.deleteAnimal);

module.exports = router;
