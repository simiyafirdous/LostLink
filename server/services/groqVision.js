const fs = require("fs");
const path = require("path");
const { z } = require("zod");
const Groq = require("groq-sdk");

const VisionAttributesSchema = z.object({
  category: z.enum([
    "wallet", "phone", "bag", "keys", "watch", "laptop",
    "documents", "jewellery", "clothing", "eyewear", "other"
  ]).catch("other"),
  primary_color: z.string().catch("unknown"),
  secondary_colors: z.array(z.string()).catch([]),
  brand: z.string().nullable().catch(null),
  material: z.string().nullable().catch(null),
  shape_or_form: z.string().catch("unknown"),
  distinctive_features: z.array(z.string()).catch([]),
  text_visible: z.string().nullable().catch(null),
  condition: z.enum(["new", "good", "worn", "damaged"]).catch("good"),
  description: z.string().catch("Item reported on lost and found platform."),
  confidence: z.number().min(0).max(1).catch(0.8)
});

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is missing.");
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

/**
 * Converts a file path or URL to a base64 data URI string suitable for Groq Vision API.
 */
const imageToDataUri = (imagePath) => {
  if (!imagePath) throw new Error("Image path is required.");
  if (imagePath.startsWith("data:") || imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const absolutePath = path.isAbsolute(imagePath) ? imagePath : path.join(process.cwd(), imagePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Image file not found at ${absolutePath}`);
  }
  const fileBuffer = fs.readFileSync(absolutePath);
  const ext = path.extname(absolutePath).toLowerCase();
  let mimeType = "image/jpeg";
  if (ext === ".png") mimeType = "image/png";
  else if (ext === ".webp") mimeType = "image/webp";
  else if (ext === ".gif") mimeType = "image/gif";
  
  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
};

const SYSTEM_PROMPT = `You are a precise computer vision assistant for a Lost and Found matching system.
Analyse the image provided and output JSON conforming EXACTLY to this contract:
{
  "category": "wallet | phone | bag | keys | watch | laptop | documents | jewellery | clothing | eyewear | other",
  "primary_color": "string",
  "secondary_colors": ["string"],
  "brand": "string or null",
  "material": "string or null",
  "shape_or_form": "string",
  "distinctive_features": ["string"],
  "text_visible": "string or null (include engraved names, serial numbers, labels, stickers)",
  "condition": "new | good | worn | damaged",
  "description": "one natural sentence describing the object",
  "confidence": 0.0 to 1.0
}
Output ONLY valid JSON. No conversational text or markdown wrappers.`;

/**
 * Extracts structured attributes from an image using Groq Vision model.
 */
const extractAttributes = async (imagePath, retriesLeft = 1) => {
  const startTime = Date.now();
  const groq = getGroqClient();
  const model = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
  const dataUri = imageToDataUri(imagePath);

  try {
    const response = await groq.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract object features for lost and found index." },
            { type: "image_url", image_url: { url: dataUri } }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const latencyMs = Date.now() - startTime;
    const usage = response.usage || {};
    console.log(`[Groq Vision API] Model: ${model} | Latency: ${latencyMs}ms | Tokens: ${usage.total_tokens || "N/A"} (Prompt: ${usage.prompt_tokens || "N/A"}, Completion: ${usage.completion_tokens || "N/A"})`);

    const rawContent = response.choices?.[0]?.message?.content || "{}";
    const parsedJson = JSON.parse(rawContent);
    const validated = VisionAttributesSchema.parse(parsedJson);

    return validated;
  } catch (error) {
    console.error(`[Groq Vision Error] Attempt failed (Retries left: ${retriesLeft}):`, error.message);
    if (retriesLeft > 0) {
      return extractAttributes(imagePath, retriesLeft - 1);
    }
    throw error;
  }
};

module.exports = {
  extractAttributes,
  VisionAttributesSchema
};
