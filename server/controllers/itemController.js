const Item = require("../models/Item");
const { extractAttributes } = require("../services/groqVision");
const { embed } = require("../services/embeddings");
const { findMatches } = require("../services/matchEngine");

const allowedFields = [
  "type", "reportType", "name", "description", "category", "location",
  "locationText", "coordinates", "date", "incidentDate", "color", "brand",
  "socialMediaUrl", "ai", "status"
];

const pickFields = (body) => Object.fromEntries(
  allowedFields.filter((key) => body[key] !== undefined).map((key) => [key, body[key]])
);

const createItem = async (req, res, next) => {
  try {
    const data = pickFields(req.body);
    const itemType = data.type || data.reportType;

    if (!itemType || !data.name || !data.description || !data.category) {
      return res.status(400).json({ message: "Report type, name, description, and category are required." });
    }

    if (!["lost", "found"].includes(itemType)) {
      return res.status(400).json({ message: "Report type must be 'lost' or 'found'." });
    }

    if (itemType === "found" && !req.user) {
      return res.status(401).json({ message: "Authentication is required to report found items." });
    }

    // Handle Location formatting
    let locationObj = { type: "Point", coordinates: [0, 0] };
    if (data.coordinates) {
      let coords = data.coordinates;
      if (typeof coords === "string") {
        try { coords = JSON.parse(coords); } catch (e) { coords = [0, 0]; }
      }
      if (Array.isArray(coords) && coords.length === 2) {
        locationObj.coordinates = coords;
      }
    }
    const locationTextStr = data.locationText || (typeof data.location === "string" ? data.location : "Unknown location");

    // Handle Incident Date formatting
    const dateVal = data.incidentDate || data.date || new Date();

    const imageUrlStr = req.file ? `/uploads/${req.file.filename}` : (data.imageUrl || data.image || "");

    // Create Item record
    const item = new Item({
      ...data,
      type: itemType,
      reportType: itemType,
      name: data.name,
      description: data.description,
      category: data.category,
      color: data.color || "",
      brand: data.brand || "",
      socialMediaUrl: data.socialMediaUrl || "",
      imageUrl: imageUrlStr,
      image: imageUrlStr,
      location: locationObj,
      locationText: locationTextStr,
      incidentDate: dateVal,
      date: dateVal,
      owner: req.user ? req.user._id : null,
      status: data.status || "open",
      aiStatus: req.file ? "pending" : "done"
    });

    await item.save();

    // Trigger Groq Vision Extraction asynchronously if image present
    if (req.file) {
      try {
        const attributes = await extractAttributes(req.file.path);
        const descriptionText = `${attributes.description || item.description} ${item.name} ${item.category}`;
        const embedding = await embed(descriptionText);

        item.ai = attributes;
        item.descEmbedding = embedding;
        item.aiStatus = "done";
        await item.save();
      } catch (aiError) {
        console.error(`[AI Vision Error] Item ${item._id} attribute extraction failed:`, aiError.message);
        item.aiStatus = "failed";
        await item.save();
      }
    }

    const populatedItem = await Item.findById(item._id).populate("owner", "name email");
    res.status(201).json({ item: populatedItem });
  } catch (error) {
    next(error);
  }
};

const getItems = async (req, res, next) => {
  try {
    const { q, type, reportType, category, status, location, page = 1, limit = 12 } = req.query;
    const filter = {};

    const targetType = type || reportType;
    if (targetType) filter.$or = [{ type: targetType }, { reportType: targetType }];

    if (category) filter.category = new RegExp(category, "i");
    
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ["open", "verified", "claim_pending"] };
    }

    if (location) filter.locationText = new RegExp(location, "i");
    if (q) filter.$text = { $search: q };

    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);

    const [items, total] = await Promise.all([
      Item.find(filter)
        .populate("owner", "name")
        .sort(q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Item.countDocuments(filter),
    ]);

    res.json({ items, page: safePage, total, pages: Math.ceil(total / safeLimit) });
  } catch (error) {
    next(error);
  }
};

const getMyItems = async (req, res, next) => {
  try {
    res.json({ items: await Item.find({ owner: req.user._id }).sort({ createdAt: -1 }) });
  } catch (error) {
    next(error);
  }
};

const getItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate("owner", "name email")
      .populate("reviewedBy", "name");

    if (!item) return res.status(404).json({ message: "Item not found." });
    res.json({ item });
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found." });

    if (item.owner.toString() !== req.user._id.toString() && req.user.role === "user") {
      return res.status(403).json({ message: "You can only edit your own reports." });
    }

    const data = pickFields(req.body);
    if (data.ai) {
      item.ai = typeof data.ai === "string" ? JSON.parse(data.ai) : data.ai;
    }

    Object.assign(item, data);

    if (req.file) {
      item.imageUrl = `/uploads/${req.file.filename}`;
      item.image = item.imageUrl;
      item.aiStatus = "pending";
      await item.save();

      try {
        const attributes = await extractAttributes(req.file.path);
        const descriptionText = `${attributes.description || item.description} ${item.name} ${item.category}`;
        const embedding = await embed(descriptionText);

        item.ai = attributes;
        item.descEmbedding = embedding;
        item.aiStatus = "done";
      } catch (aiError) {
        console.error("AI re-extraction on update failed:", aiError.message);
        item.aiStatus = "failed";
      }
    } else if (item.ai?.description) {
      // Recompute embedding if ai description updated
      const descriptionText = `${item.ai.description} ${item.name} ${item.category}`;
      item.descEmbedding = await embed(descriptionText);
    }

    await item.save();
    res.json({ item });
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found." });

    if (item.owner.toString() !== req.user._id.toString() && !["moderator", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "You can only delete your own reports." });
    }

    await item.deleteOne();
    res.json({ message: "Item deleted." });
  } catch (error) {
    next(error);
  }
};

const getReviewQueue = async (req, res, next) => {
  try {
    res.json({ items: await Item.find({ status: "pending" }).populate("owner", "name email").sort({ createdAt: 1 }) });
  } catch (error) { next(error); }
};

const reviewItem = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    const item = await Item.findByIdAndUpdate(req.params.id, { status, reviewNote, reviewedBy: req.user._id }, { new: true });
    if (!item) return res.status(404).json({ message: "Item not found." });
    res.json({ item });
  } catch (error) { next(error); }
};

const itemStats = async (req, res, next) => {
  try {
    res.json({ stats: await Item.aggregate([{ $group: { _id: { reportType: "$reportType", status: "$status" }, count: { $sum: 1 } } }]) });
  } catch (error) { next(error); }
};

module.exports = {
  createItem,
  getItems,
  getMyItems,
  getItem,
  updateItem,
  deleteItem,
  getReviewQueue,
  reviewItem,
  itemStats
};
