const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const Item = require("../models/Item");
const connectDatabase = require("../config/db");

const createIndexes = async () => {
  try {
    await connectDatabase();
    console.log("Connected to MongoDB for index migration...");

    const collection = Item.collection;

    // Create 2dsphere index on location
    await collection.createIndex({ location: "2dsphere" }, { background: true });
    console.log("Created 2dsphere index on location");

    // Create compound index for fast candidate retrieval
    await collection.createIndex(
      { type: 1, "ai.category": 1, status: 1, incidentDate: -1 },
      { background: true }
    );
    console.log("Created compound index { type: 1, 'ai.category': 1, status: 1, incidentDate: -1 }");

    // Create text index on ai.description and ai.text_visible
    await collection.createIndex(
      { "ai.description": "text", "ai.text_visible": "text", name: "text", description: "text" },
      { background: true, name: "ai_text_search_index" }
    );
    console.log("Created text search index on ai attributes");

    console.log("All indexes created successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Index creation failed:", error);
    process.exit(1);
  }
};

createIndexes();
