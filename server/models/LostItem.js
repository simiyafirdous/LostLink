const mongoose = require("mongoose");

const lostItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    dateLost: { type: Date, required: true },
    identifyingDetails: { type: String, trim: true, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
    status: { type: String, default: "lost" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LostItem", lostItemSchema);
