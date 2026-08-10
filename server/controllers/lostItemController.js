const mongoose = require("mongoose");
const LostItem = require("../models/LostItem");

const validId = (id) => mongoose.isValidObjectId(id);

const createLostItem = async (req, res, next) => {
  try {
    const { itemName, category, description, location, dateLost, identifyingDetails } = req.body;
    if (!itemName || !category || !description || !location || !dateLost) return res.status(400).json({ message: "Item name, category, description, location, and date lost are required." });
    const lostItem = await LostItem.create({ itemName, category, description, location, dateLost, identifyingDetails, ownerId: req.user._id, imageUrl: req.file ? `/uploads/${req.file.filename}` : "" });
    res.status(201).json({ lostItem });
  } catch (error) { next(error); }
};

const getLostItems = async (req, res, next) => {
  try {
    const lostItems = await LostItem.find().sort({ createdAt: -1 });
    res.json({ lostItems });
  } catch (error) { next(error); }
};

const getMyLostItems = async (req, res, next) => {
  try { res.json({ lostItems: await LostItem.find({ ownerId: req.user._id }).sort({ createdAt: -1 }) }); } catch (error) { next(error); }
};

const getLostItem = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid lost item ID." });
    const lostItem = await LostItem.findById(req.params.id);
    if (!lostItem) return res.status(404).json({ message: "Lost item not found." });
    res.json({ lostItem });
  } catch (error) { next(error); }
};

const updateLostItem = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid lost item ID." });
    const lostItem = await LostItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lostItem) return res.status(404).json({ message: "Lost item not found." });
    res.json({ lostItem });
  } catch (error) { next(error); }
};

const deleteLostItem = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid lost item ID." });
    const lostItem = await LostItem.findByIdAndDelete(req.params.id);
    if (!lostItem) return res.status(404).json({ message: "Lost item not found." });
    res.json({ message: "Lost item deleted." });
  } catch (error) { next(error); }
};

module.exports = { createLostItem, getLostItems, getMyLostItems, getLostItem, updateLostItem, deleteLostItem };
