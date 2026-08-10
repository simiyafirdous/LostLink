const Item = require("../models/Item");
const Notification = require("../models/Notification");
const Match = require("../models/Match");
const { cosineSimilarity } = require("./imageEmbeddingService");

const stopWords = new Set(["a", "an", "the", "and", "or", "my", "i", "was", "is", "it", "of", "in", "at", "near", "to", "for", "with", "found", "lost"]);
const words = (text = "") => [...new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !stopWords.has(word)))];
const overlap = (left, right) => words(left).some((word) => words(right).includes(word));
const same = (left, right) => String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();

const number = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};
const config = () => ({
  imageWeight: number("IMAGE_MATCH_WEIGHT", 0.7),
  contextWeight: number("CONTEXT_MATCH_WEIGHT", 0.3),
  highThreshold: number("IMAGE_MATCH_HIGH_THRESHOLD", 85),
  possibleThreshold: number("IMAGE_MATCH_POSSIBLE_THRESHOLD", 70),
});

const contextScore = (lost, found) => {
  let score = 0;
  const reasons = [];
  if (same(lost.category, found.category)) { score += 30; reasons.push("Same category"); }
  if (overlap(lost.name, found.name)) { score += 15; reasons.push("Similar item name"); }
  const descriptionMatch = overlap(`${lost.description} ${lost.color || ""} ${lost.brand || ""}`, `${found.description} ${found.color || ""} ${found.brand || ""}`);
  if (descriptionMatch) { score += 25; reasons.push("Similar description or identifying details"); }
  if (same(lost.color, found.color) && lost.color) { score += 15; reasons.push("Same reported color"); }
  if (overlap(lost.location, found.location)) { score += 15; reasons.push("Approximate location match"); }
  const dayDifference = Math.abs(new Date(lost.date) - new Date(found.date)) / 86400000;
  if (dayDifference <= 14) { score += 15; reasons.push("Nearby report date"); }
  return { score: Math.min(100, score), reasons };
};

const scoreMatch = (lost, found) => {
  const rawImageSimilarity = cosineSimilarity(lost.imageEmbedding, found.imageEmbedding);
  if (rawImageSimilarity === null) return null;
  const imageScore = Math.max(0, Math.min(100, rawImageSimilarity * 100));
  const context = contextScore(lost, found);
  const settings = config();
  const weightTotal = settings.imageWeight + settings.contextWeight;
  const score = Math.round(((imageScore * settings.imageWeight) + (context.score * settings.contextWeight)) / weightTotal);
  const reasons = [`Visual similarity: ${Math.round(imageScore)}%`, ...context.reasons];
  const strength = score >= settings.highThreshold ? "High-confidence possible match" : score >= settings.possibleThreshold ? "Possible match" : null;
  return { score, imageScore: Math.round(imageScore), contextScore: context.score, reasons, strength };
};

const findMatchesForFoundItem = async (foundItem) => {
  if (!foundItem.imageEmbedding?.length) return [];
  const lostItems = await Item.find({ reportType: "lost", status: { $ne: "rejected" }, imageEmbeddingStatus: "ready", _id: { $ne: foundItem._id } }).select("+imageEmbedding").populate("owner", "name");
  const threshold = config().possibleThreshold;
  return lostItems.map((lostItem) => {
    const result = scoreMatch(lostItem, foundItem);
    return result && { lostItem, ...result };
  }).filter((match) => match && match.score >= threshold).sort((a, b) => b.score - a.score);
};

const createMatchNotifications = async (foundItem) => {
  const matches = await findMatchesForFoundItem(foundItem);
  await Promise.all(matches.map(async ({ lostItem, score, imageScore, contextScore, reasons, strength }) => {
    try {
      await Match.findOneAndUpdate(
        { lostItemId: lostItem._id, foundItemId: foundItem._id },
        { similarityScore: score, imageSimilarityScore: imageScore, contextSimilarityScore: contextScore, matchingFactors: reasons, status: strength.startsWith("High") ? "high_confidence" : "possible" },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      await Notification.create({
        userId: lostItem.owner._id,
        title: "Possible Match Found",
        message: `A found-item report may match your lost item “${lostItem.name}”. Final ownership still requires claim review.`,
        relatedLostItemId: lostItem._id,
        relatedFoundItemId: foundItem._id,
        matchScore: score,
        reasons,
        socialMediaUrl: foundItem.socialMediaUrl || "",
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }));
  return matches;
};
module.exports = { scoreMatch, findMatchesForFoundItem, createMatchNotifications };
