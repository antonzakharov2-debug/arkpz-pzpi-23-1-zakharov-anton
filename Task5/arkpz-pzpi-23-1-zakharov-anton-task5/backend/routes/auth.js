const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);

// update / delete user by id
router.put("/:id", authController.updateUser);
router.delete("/:id", authController.deleteUser);

module.exports = router;