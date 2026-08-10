const LostItem = require("../models/LostItem");
const Notification = require("../models/Notification");
const { compareItemSemantics } = require("./groqService");

const normalize = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((word) => word.length > 2);
const hasOverlap = (left, right) => normalize(left).some((word) => normalize(right).includes(word));
const same = (left, right) => String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
const nearbyDate = (left, right) => Math.abs(new Date(left) - new Date(right)) / 86400000 <= 14;

const ruleBasedMatch = (lostItem, foundItem) => {
  const reasons = [];
  let score = 0;
  const categoryMatches = same(lostItem.category, foundItem.category);
  if (categoryMatches) { score += 25; reasons.push("Same category"); }
  if (hasOverlap(lostItem.itemName, foundItem.itemName)) { score += 20; reasons.push("Similar item name"); }
  if (hasOverlap(`${lostItem.description} ${lostItem.identifyingDetails}`, `${foundItem.description} ${foundItem.identifyingDetails}`)) { score += 25; reasons.push("Similar description or identifying characteristics"); }
  if (hasOverlap(lostItem.location, foundItem.location)) { score += 20; reasons.push("Similar location"); }
  if (nearbyDate(lostItem.dateLost, foundItem.dateFound)) { score += 10; reasons.push("Nearby report date"); }
  return { score, reasons, categoryMatches };
};

const scorePossibleMatch = async (lostItem, foundItem) => {
  const rules = ruleBasedMatch(lostItem, foundItem);
  // Category disagreement is an explicit hard stop: an LLM cannot override it.
  if (!rules.categoryMatches) return { ...rules, finalScore: rules.score, semantic: null, strength: null };
  let semantic = null;
  try { semantic = await compareItemSemantics(lostItem, foundItem); } catch (error) { console.error(error.message); }
  const adjustment = semantic ? Math.max(-10, Math.min(10, Math.round((semantic.semanticScore - 50) / 5))) : 0;
  const finalScore = Math.max(0, Math.min(100, rules.score + adjustment));
  const reasons = [...rules.reasons, ...(semantic?.matchingReasons || [])];
  const strength = finalScore >= 80 ? "Strong Possible Match" : finalScore >= 60 ? "Possible Match" : null;
  return { ...rules, reasons: [...new Set(reasons)], finalScore, semantic, strength };
};

const createSmartMatchAlerts = async (foundItem) => {
  const lostItems = await LostItem.find({ status: "lost", _id: { $ne: foundItem._id } });
  const results = await Promise.all(lostItems.map(async (lostItem) => ({ lostItem, ...(await scorePossibleMatch(lostItem, foundItem)) })));
  const matches = results.filter((result) => result.strength);
  await Promise.all(matches.map(async ({ lostItem, finalScore, reasons, semantic, strength }) => {
    const message = `${strength}: a found-item report may match your lost item “${lostItem.itemName}”. This is only a possible match and does not confirm ownership.`;
    await Notification.findOneAndUpdate(
      { userId: lostItem.ownerId, relatedLostItemId: lostItem._id, relatedFoundItemId: foundItem._id, type: "possible_match" },
      {
        userId: lostItem.ownerId, type: "possible_match", title: strength, message,
        relatedLostItemId: lostItem._id, relatedLostItemModel: "LostItem",
        relatedFoundItemId: foundItem._id, relatedFoundItemModel: "FoundItem",
        matchScore: finalScore, reasons, matchReasons: reasons,
        semanticInfo: semantic || undefined, socialMediaUrl: foundItem.socialMediaUrl || "", isRead: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }));
  return matches;
};

module.exports = { ruleBasedMatch, scorePossibleMatch, createSmartMatchAlerts };
