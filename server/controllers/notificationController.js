const Notification = require("../models/Notification");

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate("relatedLostItemId", "name itemName")
      .populate("relatedFoundItemId", "name itemName image imageUrl location date dateFound")
      .sort({ createdAt: -1 });
    res.json({ notifications, unreadCount: notifications.filter((notification) => !notification.isRead).length });
  } catch (error) { next(error); }
};
const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ message: "Notification not found." });
    res.json({ notification });
  } catch (error) { next(error); }
};
const markAllRead = async (req, res, next) => {
  try { await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true }); res.json({ message: "Notifications marked as read." }); } catch (error) { next(error); }
};
module.exports = { getMyNotifications, markRead, markAllRead };
