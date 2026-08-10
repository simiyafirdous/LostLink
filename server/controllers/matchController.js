const Item = require("../models/Item");
const { findMatches } = require("../services/matchEngine");
const { extractAttributes } = require("../services/groqVision");
const { embed } = require("../services/embeddings");
const Groq = require("groq-sdk");

/**
 * GET /api/items/:id/matches
 * Returns ranked match candidates for an item.
 */
const getItemMatches = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item report not found." });

    if (item.owner.toString() !== req.user._id.toString() && !["moderator", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "You can only view match suggestions for your own item reports." });
    }

    const matches = await findMatches(item, {
      threshold: process.env.MATCH_SCORE_THRESHOLD,
      radiusKm: process.env.MATCH_RADIUS_KM,
      dateWindowDays: process.env.MATCH_DATE_WINDOW_DAYS
    });

    // Sanitize finder contact details (Safety rule: never expose contact before claim approval)
    const sanitizedMatches = matches.map((m) => {
      const candidateItem = m.item;
      return {
        _id: candidateItem._id,
        name: candidateItem.name,
        type: candidateItem.type || candidateItem.reportType,
        category: candidateItem.category,
        locationText: candidateItem.locationText || candidateItem.location,
        incidentDate: candidateItem.incidentDate || candidateItem.date,
        imageUrl: candidateItem.imageUrl || candidateItem.image,
        description: candidateItem.description,
        score: m.score,
        matchReasons: m.matchReasons,
        ai: candidateItem.ai ? {
          category: candidateItem.ai.category,
          primary_color: candidateItem.ai.primary_color,
          brand: candidateItem.ai.brand,
          shape_or_form: candidateItem.ai.shape_or_form,
          condition: candidateItem.ai.condition,
          // Hide exact sensitive text_visible in public API response if it looks like a serial/ID
          text_visible: candidateItem.ai.text_visible ? "[WITHHELD FOR SAFETY]" : null
        } : null
      };
    });

    res.json({
      targetItem: {
        _id: item._id,
        name: item.name,
        type: item.type || item.reportType,
        aiStatus: item.aiStatus
      },
      matches: sanitizedMatches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/items/:id/reanalyze
 * Owner-only endpoint to force re-extraction of AI vision attributes and embeddings.
 */
const reanalyzeItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found." });

    if (item.owner.toString() !== req.user._id.toString() && !["moderator", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only the item owner can trigger re-analysis." });
    }

    if (!item.imageUrl && !item.image) {
      return res.status(400).json({ message: "Item does not have an image attached for analysis." });
    }

    item.aiStatus = "pending";
    await item.save();

    const imagePath = item.imageUrl || item.image;
    try {
      const attributes = await extractAttributes(imagePath);
      const embedding = await embed(`${attributes.description} ${item.name} ${item.description}`);

      item.ai = attributes;
      item.descEmbedding = embedding;
      item.aiStatus = "done";
      await item.save();

      res.json({ message: "AI analysis re-run successfully.", item });
    } catch (aiError) {
      item.aiStatus = "failed";
      await item.save();
      res.status(500).json({ message: "AI attribute extraction failed during re-analysis.", error: aiError.message });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/items/:id/verify-questions
 * Generates 2-3 verification questions using Groq that only the true owner could answer.
 */
const getVerifyQuestions = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found." });

    const ai = item.ai || {};
    const textContext = `Item: ${item.name}, Category: ${item.category}, Colors: ${ai.primary_color || item.color}, Features: ${(ai.distinctive_features || []).join(", ")}, Material: ${ai.material || "Unknown"}`;

    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const prompt = `Generate 2 to 3 specific verification questions to confirm ownership of a lost/found item without revealing answers in the question text.
Item details: ${textContext}
Output JSON format ONLY:
{
  "questions": ["Question 1?", "Question 2?", "Question 3?"]
}`;
        const response = await groq.chat.completions.create({
          model: process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2
        });

        const parsed = JSON.parse(response.choices?.[0]?.message?.content || "{}");
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return res.json({ questions: parsed.questions });
        }
      } catch (err) {
        console.warn("[VerifyQuestions] Groq question generation failed, using structured fallback:", err.message);
      }
    }

    // Fallback default verification questions based on category
    const defaultQuestions = [
      `What unique contents, markings, or wear marks are inside or on the ${item.category || "item"}?`,
      `Can you describe any specific interior details, scratches, or stickers on the ${item.category || "item"}?`,
      `Where and approximately at what exact time of day did you last have or find this ${item.category || "item"}?`
    ];

    res.json({ questions: defaultQuestions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getItemMatches,
  reanalyzeItem,
  getVerifyQuestions
};
