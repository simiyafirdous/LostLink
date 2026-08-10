const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    // Extended fields
    foundItem: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    lostItem: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    claimant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    finder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    matchScore: { type: Number, default: 0 },
    verificationAnswers: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true }
      }
    ],

    // Legacy fields
    item: { type: mongoose.Schema.Types.ObjectId, refPath: "itemModel" },
    itemModel: { type: String, enum: ["Item", "FoundItem"], default: "Item" },
    message: { type: String, trim: true, maxlength: 1200, default: "" },
    proofDetails: { type: String, trim: true, maxlength: 1200, default: "" },

    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

claimSchema.pre("save", function (next) {
  if (!this.item && this.foundItem) this.item = this.foundItem;
  if (!this.foundItem && this.item) this.foundItem = this.item;
  next();
});

claimSchema.index({ foundItem: 1, claimant: 1 });
claimSchema.index({ finder: 1, status: 1 });

module.exports = mongoose.model("Claim", claimSchema);
