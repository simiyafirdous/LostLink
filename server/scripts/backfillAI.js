const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const Item = require("../models/Item");
const connectDatabase = require("../config/db");
const { extractAttributes } = require("../services/groqVision");
const { embed } = require("../services/embeddings");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const backfillAI = async () => {
  try {
    await connectDatabase();
    console.log("Starting AI attributes backfill migration...");

    // Find items missing AI attributes or with aiStatus !== 'done'
    const pendingItems = await Item.find({
      $or: [
        { ai: { $exists: false } },
        { ai: null },
        { aiStatus: "pending" },
        { aiStatus: "failed" }
      ]
    });

    console.log(`Found ${pendingItems.length} items requiring AI attribute extraction.`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      console.log(`[${i + 1}/${pendingItems.length}] Processing item ${item._id} (${item.name})...`);

      const imagePath = item.imageUrl || item.image;

      if (!imagePath) {
        console.log(`Item ${item._id} has no image attached. Skipping.`);
        item.aiStatus = "done";
        await item.save();
        continue;
      }

      try {
        const attributes = await extractAttributes(imagePath);
        const descriptionText = `${attributes.description || item.description} ${item.name} ${item.category}`;
        const embedding = await embed(descriptionText);

        item.ai = attributes;
        item.descEmbedding = embedding;
        item.aiStatus = "done";
        await item.save();

        successCount++;
        console.log(`✅ Successfully backfilled AI attributes for item ${item._id}`);
      } catch (err) {
        failCount++;
        item.aiStatus = "failed";
        await item.save();
        console.error(`❌ Failed to extract AI attributes for item ${item._id}:`, err.message);
      }

      // Rate limiting pause between Groq requests (1.5 seconds)
      await delay(1500);
    }

    console.log(`\n🎉 Backfill complete! Successes: ${successCount}, Failures: ${failCount}`);
    process.exit(0);
  } catch (error) {
    console.error("Backfill script error:", error);
    process.exit(1);
  }
};

backfillAI();
