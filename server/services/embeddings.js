const Groq = require("groq-sdk");

/**
 * Normalizes a numeric vector to unit length (L2 norm = 1).
 */
const normalizeVector = (vector) => {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vector;
  return vector.map((val) => val / norm);
};

/**
 * Simple deterministic fallback text embedding generator (bag-of-words hash embedding)
 * Ensures fuzzy cosine comparison works reliably even if external embedding services are offline.
 */
const generateFallbackEmbedding = (text, dimensions = 384) => {
  const vector = new Array(dimensions).fill(0);
  if (!text || typeof text !== "string") return vector;

  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  words.forEach((word) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;
  });

  return normalizeVector(vector);
};

/**
 * Generates an embedding vector for text using Groq embedding models (or fallback).
 */
const embed = async (text) => {
  if (!text || typeof text !== "string" || !text.trim()) {
    return new Array(384).fill(0);
  }

  const model = process.env.GROQ_EMBED_MODEL || "bge-small-en-v1.5";

  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.embeddings.create({
        model: model,
        input: text.slice(0, 1000)
      });
      if (response && response.data && response.data[0] && response.data[0].embedding) {
        return normalizeVector(response.data[0].embedding);
      }
    } catch (err) {
      console.warn(`[Embeddings] Groq embedding call (${model}) failed, falling back to local text embedding:`, err.message);
    }
  }

  return generateFallbackEmbedding(text);
};

module.exports = {
  embed,
  normalizeVector,
  generateFallbackEmbedding
};
