const express = require("express");
const router = express.Router();
const farmController = require("../controllers/farmController");

router.get("/", farmController.getFarms);
router.post("/", farmController.createFarm); // додано
router.get("/:id", farmController.getFarmDetails);
router.put("/:id", farmController.updateFarm);
router.delete("/:id", farmController.deleteFarm);

module.exports = router;
