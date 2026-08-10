const User = require("../models/User");
const Item = require("../models/Item");
const Claim = require("../models/Claim");

const getDashboard = async (req, res, next) => {
  try {
    const [users, items, claims, roles] = await Promise.all([
      User.countDocuments(), Item.countDocuments(), Claim.countDocuments(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    ]);
    res.json({ users, items, claims, roles });
  } catch (error) { next(error); }
};
const getUsers = async (req, res, next) => {
  try { res.json({ users: await User.find().select("-password").sort({ createdAt: -1 }) }); } catch (error) { next(error); }
};
const updateUser = async (req, res, next) => {
  try {
    const updates = {};
    if (["user", "moderator", "admin"].includes(req.body.role)) updates.role = req.body.role;
    if (typeof req.body.isActive === "boolean") updates.isActive = req.body.isActive;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (error) { next(error); }
};
module.exports = { getDashboard, getUsers, updateUser };
