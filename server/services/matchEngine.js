const Item = require("../models/Item");
const {
  ADJACENT_CATEGORIES,
  cosineSimilarity,
  scoreTextVisible,
  scoreBrand,
  scoreColor,
  scoreFeatures,
  scoreMaterialAndCondition
} = require("../utils/similarity");

/**
 * Executes Pass 1 (Hard Filter via MongoDB) and Pass 2 (Scoring & Ranking)
 * to find plausible matches for a target Item (Lost or Found).
 */
const findMatches = async (targetItem, options = {}) => {
  const threshold = Number(options.threshold) || Number(process.env.MATCH_SCORE_THRESHOLD) || 45;
  const radiusKm = Number(options.radiusKm) || Number(process.env.MATCH_RADIUS_KM) || 25;
  const dateWindowDays = Number(options.dateWindowDays) || Number(process.env.MATCH_DATE_WINDOW_DAYS) || 90;

  const targetType = targetItem.type || targetItem.reportType;
  const oppositeType = targetType === "lost" ? "found" : "lost";

  const itemCategory = (targetItem.ai?.category || targetItem.category || "other").toLowerCase();
  const allowedCategories = Array.from(
    new Set([itemCategory, ...(ADJACENT_CATEGORIES[itemCategory] || [])])
  );

  const targetDate = targetItem.incidentDate || targetItem.date || new Date();
  const minDate = new Date(targetDate.getTime() - dateWindowDays * 24 * 60 * 60 * 1000);
  const maxDate = new Date(targetDate.getTime() + dateWindowDays * 24 * 60 * 60 * 1000);

  // Pass 1: MongoDB Query / Hard Filter
  const baseFilter = {
    _id: { $ne: targetItem._id },
    $or: [
      { type: oppositeType },
      { reportType: oppositeType }
    ],
    status: { $in: ["open", "verified"] },
    $and: [
      {
        $or: [
          { "ai.category": { $in: allowedCategories } },
          { category: { $in: allowedCategories } }
        ]
      },
      {
        $or: [
          { incidentDate: { $gte: minDate, $lte: maxDate } },
          { date: { $gte: minDate, $lte: maxDate } }
        ]
      }
    ]
  };

  // Perform GeoSpatial query if coordinates are available
  let candidateItems = [];
  const coords = targetItem.location?.coordinates;
  const hasValidCoords = Array.isArray(coords) && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0);

  if (hasValidCoords) {
    try {
      const meters = radiusKm * 1000;
      candidateItems = await Item.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: coords },
            distanceField: "distanceMeters",
            maxDistance: meters,
            query: baseFilter,
            spherical: true
          }
        },
        { $limit: 100 }
      ]);
    } catch (err) {
      console.warn("[MatchEngine] GeoNear query failed, falling back to standard find:", err.message);
      candidateItems = await Item.find(baseFilter).select("+descEmbedding").limit(100).lean();
    }
  } else {
    candidateItems = await Item.find(baseFilter).select("+descEmbedding").limit(100).lean();
  }

  // Fetch full descEmbedding for target item if missing
  let targetEmbedding = targetItem.descEmbedding;
  if (!targetEmbedding && targetItem._id) {
    const fullDoc = await Item.findById(targetItem._id).select("+descEmbedding").lean();
    targetEmbedding = fullDoc?.descEmbedding;
  }

  // Pass 2: Score and Rank
  const scoredCandidates = candidateItems.map((candidate) => {
    let totalScore = 0;
    const matchReasons = [];

    const aiA = targetItem.ai || {};
    const aiB = candidate.ai || {};

    // 1. Text visible match (30 pts max)
    const textVisibleResult = scoreTextVisible(
      aiA.text_visible || targetItem.description,
      aiB.text_visible || candidate.description
    );
    totalScore += textVisibleResult.score;
    if (textVisibleResult.reason) matchReasons.push(textVisibleResult.reason);

    // 2. Brand match (20 pts max)
    const brandResult = scoreBrand(
      aiA.brand || targetItem.brand,
      aiB.brand || candidate.brand
    );
    totalScore += brandResult.score;
    if (brandResult.reason) matchReasons.push(brandResult.reason);

    // 3. Primary color match (15 pts max)
    const colorResult = scoreColor(
      aiA.primary_color || targetItem.color,
      aiA.secondary_colors,
      aiB.primary_color || candidate.color,
      aiB.secondary_colors
    );
    totalScore += colorResult.score;
    if (colorResult.reason) matchReasons.push(colorResult.reason);

    // 4. Description embedding cosine similarity (20 pts max)
    if (targetEmbedding && candidate.descEmbedding) {
      const cosSim = cosineSimilarity(targetEmbedding, candidate.descEmbedding);
      if (cosSim > 0) {
        const embedScore = Math.round(Math.min(1, Math.max(0, cosSim)) * 20);
        totalScore += embedScore;
        if (embedScore >= 10) {
          matchReasons.push(`High description similarity (${Math.round(cosSim * 100)}%)`);
        }
      }
    }

    // 5. Distinctive features overlap (10 pts max)
    const featureResult = scoreFeatures(
      aiA.distinctive_features,
      aiB.distinctive_features
    );
    totalScore += featureResult.score;
    if (featureResult.reason) matchReasons.push(featureResult.reason);

    // 6. Material + condition match (5 pts max)
    const matCondResult = scoreMaterialAndCondition(
      aiA.material,
      aiA.condition,
      aiB.material,
      aiB.condition
    );
    totalScore += matCondResult.score;
    matCondResult.reasons.forEach((r) => matchReasons.push(r));

    const finalScore = Math.min(100, Math.max(0, totalScore));

    return {
      item: candidate,
      candidateId: candidate._id,
      score: finalScore,
      matchReasons,
      category: aiB.category || candidate.category,
      imageUrl: candidate.imageUrl || candidate.image
    };
  });

  // Filter candidates above threshold and sort descending
  const filteredRanked = scoredCandidates
    .filter((c) => c.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return filteredRanked;
};

module.exports = {
  findMatches
};
