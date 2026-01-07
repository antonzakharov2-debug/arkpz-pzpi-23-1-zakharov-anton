const Notification = require("../models/Notification");

exports.get = async (req, res) => {
  const { userId } = req.query;
  try {
    const filter = userId ? { recipients: userId } : {};
    const notifications = await Notification.find(filter)
      .populate("farm", "name")
      .populate("animal", "animalNumber species")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notifications", error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndDelete(req.params.id);
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting notification", error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: "Notification not found" });

    const exists = (notif.readBy || []).some(id => String(id) === String(userId));
    if (!exists) {
      notif.readBy = notif.readBy || [];
      notif.readBy.push(userId);
      await notif.save();
    }

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Error marking notification read", error: err.message });
  }
};