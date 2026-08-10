const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["possible_match"], default: "possible_match" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedLostItemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "relatedLostItemModel" },
  relatedLostItemModel: { type: String, enum: ["Item", "LostItem"], default: "Item" },
  relatedFoundItemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "relatedFoundItemModel" },
  relatedFoundItemModel: { type: String, enum: ["Item", "FoundItem"], default: "Item" },
  matchScore: { type: Number, required: true, min: 60, max: 100 },
  reasons: [{ type: String }],
  matchReasons: [{ type: String }],
  semanticInfo: {
    semanticScore: { type: Number, min: 0, max: 100 },
    matchingReasons: [{ type: String }],
    conflictingDetails: [{ type: String }],
    confidence: { type: Number, min: 0, max: 100 },
  },
  socialMediaUrl: { type: String, trim: true, default: "" },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ relatedLostItemId: 1, relatedFoundItemId: 1, type: 1 }, { unique: true });
module.exports = mongoose.model("Notification", notificationSchema);
