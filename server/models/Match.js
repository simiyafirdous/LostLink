const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  lostItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  foundItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  similarityScore: { type: Number, required: true, min: 0, max: 100 },
  imageSimilarityScore: { type: Number, required: true, min: 0, max: 100 },
  contextSimilarityScore: { type: Number, required: true, min: 0, max: 100 },
  matchingFactors: [{ type: String }],
  status: { type: String, enum: ["high_confidence", "possible", "dismissed", "claimed"], default: "possible" },
}, { timestamps: true });

matchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });
matchSchema.index({ foundItemId: 1, similarityScore: -1 });
module.exports = mongoose.model("Match", matchSchema);
