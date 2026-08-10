const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const safeResult = (value = {}) => ({
  semanticScore: Math.max(0, Math.min(100, Number(value.semanticScore) || 0)),
  matchingReasons: Array.isArray(value.matchingReasons) ? value.matchingReasons.filter((reason) => typeof reason === "string").slice(0, 5) : [],
  conflictingDetails: Array.isArray(value.conflictingDetails) ? value.conflictingDetails.filter((detail) => typeof detail === "string").slice(0, 5) : [],
  confidence: Math.max(0, Math.min(100, Number(value.confidence) || 0)),
});

const compareItemSemantics = async (lostItem, foundItem) => {
  if (!process.env.GROQ_API_KEY) return null;

  const prompt = `Compare these lost and found item reports only to assist a possible-match system. Never determine ownership, never say an item is confirmed, and use only \"Possible Match\" language. Return JSON only with semanticScore (0-100), matchingReasons (string array), conflictingDetails (string array), and confidence (0-100). Identify category conflicts clearly.\n\nLost report: ${JSON.stringify({ itemName: lostItem.itemName, category: lostItem.category, description: lostItem.description, location: lostItem.location, date: lostItem.dateLost, identifyingDetails: lostItem.identifyingDetails })}\n\nFound report: ${JSON.stringify({ itemName: foundItem.itemName, category: foundItem.category, description: foundItem.description, location: foundItem.location, date: foundItem.dateFound, identifyingDetails: foundItem.identifyingDetails })}`;
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: "You are a cautious lost-and-found matching assistant. Output valid JSON only." }, { role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Groq semantic comparison failed (${response.status}).`);
  const data = await response.json();
  return safeResult(JSON.parse(data.choices?.[0]?.message?.content || "{}"));
};

module.exports = { compareItemSemantics };
