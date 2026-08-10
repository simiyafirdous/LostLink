const path = require("path");

const MODEL = process.env.IMAGE_EMBEDDING_MODEL || "Xenova/clip-vit-base-patch32";
let extractorPromise;

const getExtractor = async () => {
  if (!extractorPromise) {
    extractorPromise = import("@huggingface/transformers").then(async ({ pipeline, env }) => {
      // Models are downloaded once and then served from this local cache.
      env.cacheDir = path.join(__dirname, "..", ".model-cache");
      return pipeline("image-feature-extraction", MODEL, { dtype: "fp32" });
    }).catch((error) => {
      extractorPromise = undefined;
      throw error;
    });
  }
  return extractorPromise;
};

const normalize = (values) => {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) throw new Error("The image embedding had zero magnitude.");
  return values.map((value) => value / magnitude);
};

const createImageEmbedding = async (filePath) => {
  const extractor = await getExtractor();
  const result = await extractor(filePath, { pooling: "mean", normalize: true });
  return { vector: normalize(Array.from(result.data)), model: MODEL };
};

const cosineSimilarity = (left, right) => {
  if (!left?.length || left.length !== right?.length) return null;
  return left.reduce((total, value, index) => total + value * right[index], 0);
};

module.exports = { createImageEmbedding, cosineSimilarity, MODEL };
