const assert = require("assert");
const {
  cosineSimilarity,
  jaccardSimilarity,
  scoreTextVisible,
  scoreBrand,
  scoreColor,
  scoreFeatures,
  scoreMaterialAndCondition
} = require("../utils/similarity");

console.log("Running similarity & scoring unit tests...");

// 1. Cosine similarity
const vecA = [1, 0, 0];
const vecB = [1, 0, 0];
const vecC = [0, 1, 0];
assert.strictEqual(cosineSimilarity(vecA, vecB), 1, "Identical vectors should have cosine similarity 1");
assert.strictEqual(cosineSimilarity(vecA, vecC), 0, "Orthogonal vectors should have cosine similarity 0");

// 2. Text visible matching
const textExact = scoreTextVisible("SN-998877", "SN-998877");
assert.strictEqual(textExact.score, 30, "Exact text match should score 30");

const textPartial = scoreTextVisible("Serial: SN-998877", "SN-998877");
assert.strictEqual(textPartial.score, 25, "Partial text match should score 25");

// 3. Brand matching
const brandExact = scoreBrand("Fossil", "Fossil");
assert.strictEqual(brandExact.score, 20, "Exact brand match should score 20");

const brandNull = scoreBrand("Fossil", null);
assert.strictEqual(brandNull.score, 0, "Null brand should score 0 without penalty");

// 4. Color matching
const colorExact = scoreColor("brown", [], "brown", []);
assert.strictEqual(colorExact.score, 15, "Exact color match should score 15");

const colorAdjacent = scoreColor("brown", [], "tan", []);
assert.strictEqual(colorAdjacent.score, 10, "Adjacent color match should score 10");

// 5. Feature matching
const featuresOverlap = scoreFeatures(["scratch on back", "blue sticker"], ["blue sticker", "worn strap"]);
assert.ok(featuresOverlap.score > 0, "Feature overlap should score > 0");

// 6. Material + Condition
const matCond = scoreMaterialAndCondition("leather", "good", "leather", "good");
assert.strictEqual(matCond.score, 5, "Matching material + condition should score 5");

console.log("✅ All similarity unit tests passed successfully!");
