const router = require("express").Router();
const c = require("../controllers/notificationController");

router.get("/", c.get);
router.delete("/:id", c.deleteNotification);
router.put("/:id/read", c.markRead);

module.exports = router;