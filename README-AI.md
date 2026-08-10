# AI Image Matching System & Architecture Guide

## Overview

The Lost & Found platform uses an **AI Visual Matching Engine** powered by **Groq Vision** (`meta-llama/llama-4-scout-17b-16e-instruct`) and text description embeddings to automatically surface plausible matches between Lost and Found items.

Rather than relying on vector image search alone (which is unsupported by Groq Vision API endpoints), the system converts uploaded photos into **structured visual attributes** and computes weighted similarity scores over a 2-pass matching pipeline.

---

## Attribute Extraction Contract

On every image upload, Groq Vision extracts the following schema with forced JSON output (`response_format: { type: "json_object" }`):

```json
{
  "category": "wallet | phone | bag | keys | watch | laptop | documents | jewellery | clothing | eyewear | other",
  "primary_color": "string",
  "secondary_colors": ["string"],
  "brand": "string or null",
  "material": "string or null",
  "shape_or_form": "string",
  "distinctive_features": ["string"],
  "text_visible": "string or null",
  "condition": "new | good | worn | damaged",
  "description": "one natural sentence describing the object",
  "confidence": 0.0 to 1.0
}
```

---

## 2-Pass Matching Algorithm

### Pass 1 — Hard Filter (MongoDB Aggregation)
Given a Lost (or Found) item:
1. Filters for opposite report type (`lost` ↔ `found`).
2. Filters for status = `"open"` or `"verified"`.
3. Category match allowing adjacent categories (e.g. `bag` ↔ `backpack`, `wallet` ↔ `documents`, `watch` ↔ `jewellery`).
4. Incident Date window within `MATCH_DATE_WINDOW_DAYS` (default 90 days).
5. GeoSpatial proximity filter via `$geoNear` within `MATCH_RADIUS_KM` (default 25 km).

### Pass 2 — Weighted Similarity Scoring & Ranking

Each candidate surviving Pass 1 is scored from `0–100` based on 6 weighted signals:

| Signal | Max Weight | Evaluation Logic |
|---|---|---|
| **Text / Serial Match** | **30** | Exact match (30 pts), partial/substring (25 pts), shared tokens (15 pts). Null scores 0. |
| **Brand Match** | **20** | Case-insensitive exact match (20 pts), partial brand (15 pts). Null on either side scores 0 (not a penalty). |
| **Primary & Secondary Color** | **15** | Exact color (15 pts), adjacent shade (10 pts), secondary color overlap (8 pts). |
| **Description Vector Embedding** | **20** | Cosine similarity between `descEmbedding` vectors, scaled to `0–20` pts. |
| **Distinctive Features** | **10** | Jaccard index on `distinctive_features` arrays scaled to `0–10` pts. |
| **Material & Condition** | **5** | Material match (3 pts) + Condition match (2 pts). |

Candidates scoring **≥ 45** (configurable threshold) are returned, ranked by score descending, alongside human-readable `matchReasons` chips (e.g. `"Same brand: Fossil"`, `"Matching primary color: brown"`).

---

## Safety & Security Rules

1. **Human Confirmation:** Matches are presented as visual suggestions only; the system never auto-confirms a match or determines ownership.
2. **Contact Detail Privacy:** Finder contact details are hidden from public responses and released **only after the finder approves a claim**.
3. **Serial Number Privacy:** Sensitive `text_visible` serial numbers are masked in public listings and accessible only to the match engine.
4. **AI Verification Questions:** 2–3 verification questions regarding non-public item details (internal wear, hidden contents) are generated using Groq to verify ownership.

---

## Environment Variables & Threshold Tuning

Adjust parameters in `server/.env`:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
MATCH_SCORE_THRESHOLD=45       # Min score (0-100) to return a candidate
MATCH_RADIUS_KM=25             # Geo radius filter in kilometers
MATCH_DATE_WINDOW_DAYS=90      # Incident date range window
AI_RATE_LIMIT_PER_HOUR=20     # Max AI analysis calls per hour per user
```

---

## Utility Commands

- **Build Database Indexes:**
  ```bash
  node server/scripts/createIndexes.js
  ```
- **Seed Near-Miss Test Dataset:**
  ```bash
  node server/scripts/seedData.js
  ```
- **Run Idempotent AI Backfill:**
  ```bash
  node server/scripts/backfillAI.js
  ```
