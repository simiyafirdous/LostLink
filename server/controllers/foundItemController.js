const mongoose = require("mongoose");
const FoundItem = require("../models/FoundItem");
const { createSmartMatchAlerts } = require("../services/smartMatchService");

const validId = (id) => mongoose.isValidObjectId(id);

const createFoundItem = async (req, res, next) => {
  try {
    const { itemName, category, description, location, dateFound, identifyingDetails, socialMediaUrl } = req.body;
    if (!itemName || !category || !description || !location || !dateFound) return res.status(400).json({ message: "Item name, category, description, location, and date found are required." });
    if (socialMediaUrl && !/^https?:\/\/.+/i.test(socialMediaUrl)) return res.status(400).json({ message: "Social-media URL must be a public http(s) link." });
    const foundItem = await FoundItem.create({ itemName, category, description, location, dateFound, identifyingDetails, socialMediaUrl, finderId: req.user._id, imageUrl: req.file ? `/uploads/${req.file.filename}` : "" });
    const matches = await createSmartMatchAlerts(foundItem);
    res.status(201).json({ foundItem, matchesCreated: matches.length });
  } catch (error) { next(error); }
};

const getFoundItems = async (req, res, next) => {
  try {
    const foundItems = await FoundItem.find().sort({ createdAt: -1 });
    res.json({ foundItems });
  } catch (error) { next(error); }
};

const getMyFoundItems = async (req, res, next) => {
  try { res.json({ foundItems: await FoundItem.find({ finderId: req.user._id }).sort({ createdAt: -1 }) }); } catch (error) { next(error); }
};

const getFoundItem = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid found item ID." });
    const foundItem = await FoundItem.findById(req.params.id);
    if (!foundItem) return res.status(404).json({ message: "Found item not found." });
    res.json({ foundItem });
  } catch (error) { next(error); }
};

const updateFoundItem = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid found item ID." });
    const foundItem = await FoundItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!foundItem) return res.status(404).json({ message: "Found item not found." });
    res.json({ foundItem });
  } catch (error) { next(error); }
};

const deleteFoundItem = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid found item ID." });
    const foundItem = await FoundItem.findByIdAndDelete(req.params.id);
    if (!foundItem) return res.status(404).json({ message: "Found item not found." });
    res.json({ message: "Found item deleted." });
  } catch (error) { next(error); }
};

module.exports = { createFoundItem, getFoundItems, getMyFoundItems, getFoundItem, updateFoundItem, deleteFoundItem };
