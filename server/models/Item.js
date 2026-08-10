const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    // Legacy & upgraded reportType / type
    reportType: { type: String, enum: ["lost", "found"], index: true },
    type: { type: String, enum: ["lost", "found"], index: true },

    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1500 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    
    // GeoJSON location + human readable location text
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },
    locationText: { type: String, trim: true, maxlength: 200 },

    // Dates
    date: { type: Date },
    incidentDate: { type: Date, index: true },

    color: { type: String, trim: true, maxlength: 50 },
    brand: { type: String, trim: true, maxlength: 60 },
    socialMediaUrl: { type: String, trim: true, maxlength: 500, default: "" },

    // Images
    image: { type: String, default: "" },
    imageUrl: { type: String, default: "" },

    // AI vision extracted attributes
    ai: {
      category: { type: String, index: true },
      primary_color: String,
      secondary_colors: [String],
      brand: { type: String, index: true },
      material: String,
      shape_or_form: String,
      distinctive_features: [String],
      text_visible: String,
      condition: String,
      description: String,
      confidence: Number
    },
    descEmbedding: { type: [Number], select: false },
    aiStatus: {
      type: String,
      enum: ["pending", "done", "failed"],
      default: "pending",
      index: true
    },

    // Legacy image embeddings
    imageEmbedding: { type: [Number], default: undefined, select: false },
    imageEmbeddingModel: { type: String, trim: true, default: "" },
    imageEmbeddingStatus: { type: String, enum: ["not_requested", "ready", "failed"], default: "not_requested" },

    // Extended status options preserving existing enums
    status: {
      type: String,
      enum: ["open", "claim_pending", "resolved", "pending", "verified", "rejected"],
      default: "open",
      index: true
    },
    resolvedWith: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

// Pre-save hook to synchronize legacy and upgraded fields
itemSchema.pre("save", function (next) {
  if (!this.type && this.reportType) this.type = this.reportType;
  if (!this.reportType && this.type) this.reportType = this.type;

  if (!this.imageUrl && this.image) this.imageUrl = this.image;
  if (!this.image && this.imageUrl) this.image = this.imageUrl;

  if (!this.incidentDate && this.date) this.incidentDate = this.date;
  if (!this.date && this.incidentDate) this.date = this.incidentDate;

  if (!this.locationText && typeof this.location === "string") {
    this.locationText = this.location;
    this.location = { type: "Point", coordinates: [0, 0] };
  } else if (!this.locationText && this.location && typeof this.location === "object" && !Array.isArray(this.location.coordinates)) {
    this.locationText = "Unknown location";
    this.location = { type: "Point", coordinates: [0, 0] };
  }
  
  if (this.ai && this.ai.category && !this.category) {
    this.category = this.ai.category;
  }
  next();
});

itemSchema.index({ name: "text", description: "text", category: "text", locationText: "text", "ai.description": "text", "ai.text_visible": "text" });
itemSchema.index({ type: 1, "ai.category": 1, status: 1, incidentDate: -1 });
itemSchema.index({ reportType: 1, category: 1, status: 1, date: -1 });

module.exports = mongoose.model("Item", itemSchema);
