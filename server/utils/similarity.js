/**
 * Vector similarity and attribute matching utilities for Lost & Found item match engine.
 */

// Adjacent color mapping for partial credit
const ADJACENT_COLORS = {
  black: ["grey", "dark grey", "charcoal"],
  grey: ["black", "silver", "white"],
  silver: ["grey", "white"],
  white: ["off-white", "cream", "silver"],
  blue: ["navy", "sky blue", "cyan"],
  navy: ["blue", "dark blue", "black"],
  brown: ["tan", "beige", "khaki", "dark brown"],
  tan: ["brown", "beige", "khaki"],
  red: ["maroon", "burgundy", "pink"],
  maroon: ["red", "burgundy", "purple"],
  yellow: ["gold", "orange"],
  gold: ["yellow", "bronze"]
};

// Category adjacency map for MongoDB hard filter & category matching
const ADJACENT_CATEGORIES = {
  bag: ["backpack", "wallet", "documents", "other"],
  backpack: ["bag", "other"],
  wallet: ["bag", "documents", "other"],
  phone: ["laptop", "other"],
  laptop: ["phone", "other"],
  keys: ["other"],
  watch: ["jewellery", "other"],
  jewellery: ["watch", "other"],
  documents: ["wallet", "bag", "other"],
  clothing: ["other"],
  eyewear: ["other"],
  other: ["wallet", "phone", "bag", "keys", "watch", "laptop", "documents", "jewellery", "clothing", "eyewear"]
};

/**
 * Computes Cosine Similarity between two numeric vectors.
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Calculates Jaccard similarity coefficient between two string arrays.
 */
const jaccardSimilarity = (arrA = [], arrB = []) => {
  if (!arrA || !arrB || (!arrA.length && !arrB.length)) return 0;
  const setA = new Set(arrA.map((s) => s.toLowerCase().trim()));
  const setB = new Set(arrB.map((s) => s.toLowerCase().trim()));

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
};

/**
 * Evaluates text visibility score (e.g. engraved serial numbers, labels, names).
 * Max score: 30
 */
const scoreTextVisible = (textA, textB) => {
  if (!textA || !textB) return { score: 0, reason: null };
  const strA = textA.toLowerCase().trim();
  const strB = textB.toLowerCase().trim();

  if (strA === strB) {
    return { score: 30, reason: `Exact text/serial match: "${textA}"` };
  }
  if (strA.includes(strB) || strB.includes(strA)) {
    return { score: 25, reason: `Matching text fragment: "${textA}" / "${textB}"` };
  }

  // Token overlap check
  const tokensA = strA.split(/\s+/);
  const tokensB = strB.split(/\s+/);
  const overlap = tokensA.filter((t) => tokensB.includes(t) && t.length > 2);

  if (overlap.length > 0) {
    return { score: 15, reason: `Shared visible text: "${overlap.join(", ")}"` };
  }

  return { score: 0, reason: null };
};

/**
 * Evaluates brand similarity.
 * Max score: 20
 */
const scoreBrand = (brandA, brandB) => {
  if (!brandA || !brandB) return { score: 0, reason: null };
  const bA = brandA.toLowerCase().trim();
  const bB = brandB.toLowerCase().trim();

  if (bA === bB) {
    return { score: 20, reason: `Same brand: ${brandA}` };
  }
  if (bA.includes(bB) || bB.includes(bA)) {
    return { score: 15, reason: `Related brand match: ${brandA} / ${brandB}` };
  }
  return { score: 0, reason: null };
};

/**
 * Evaluates primary and secondary color similarity.
 * Max score: 15
 */
const scoreColor = (primaryA, secondaryA = [], primaryB, secondaryB = []) => {
  if (!primaryA || !primaryB) return { score: 0, reason: null };
  const pA = primaryA.toLowerCase().trim();
  const pB = primaryB.toLowerCase().trim();

  if (pA === pB) {
    return { score: 15, reason: `Matching primary color: ${primaryA}` };
  }

  // Check adjacent color list
  if (ADJACENT_COLORS[pA]?.includes(pB) || ADJACENT_COLORS[pB]?.includes(pA)) {
    return { score: 10, reason: `Similar color shade: ${primaryA} / ${primaryB}` };
  }

  // Secondary color overlap
  const secA = (secondaryA || []).map((c) => c.toLowerCase());
  const secB = (secondaryB || []).map((c) => c.toLowerCase());

  if (secA.includes(pB) || secB.includes(pA) || secA.some((c) => secB.includes(c))) {
    return { score: 8, reason: `Secondary color overlap: ${primaryA} & ${primaryB}` };
  }

  return { score: 0, reason: null };
};

/**
 * Evaluates distinctive features overlap using Jaccard index.
 * Max score: 10
 */
const scoreFeatures = (featuresA = [], featuresB = []) => {
  const jaccard = jaccardSimilarity(featuresA, featuresB);
  if (jaccard > 0) {
    const score = Math.round(jaccard * 10);
    const shared = featuresA.filter((f) => featuresB.map((x) => x.toLowerCase()).includes(f.toLowerCase()));
    const reasonText = shared.length > 0 ? shared.join(", ") : "Shared distinctive features";
    return { score, reason: `Distinctive feature overlap: ${reasonText}` };
  }
  return { score: 0, reason: null };
};

/**
 * Evaluates material and condition match.
 * Max score: 5
 */
const scoreMaterialAndCondition = (materialA, conditionA, materialB, conditionB) => {
  let score = 0;
  const reasons = [];

  if (materialA && materialB && materialA.toLowerCase().trim() === materialB.toLowerCase().trim()) {
    score += 3;
    reasons.push(`Matching material: ${materialA}`);
  }

  if (conditionA && conditionB && conditionA.toLowerCase().trim() === conditionB.toLowerCase().trim()) {
    score += 2;
    reasons.push(`Matching condition: ${conditionA}`);
  }

  return { score, reasons };
};

module.exports = {
  ADJACENT_COLORS,
  ADJACENT_CATEGORIES,
  cosineSimilarity,
  jaccardSimilarity,
  scoreTextVisible,
  scoreBrand,
  scoreColor,
  scoreFeatures,
  scoreMaterialAndCondition
};
