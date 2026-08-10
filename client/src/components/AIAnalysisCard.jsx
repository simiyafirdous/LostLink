import { useState, useEffect } from "react";

export default function AIAnalysisCard({ aiData, onAttributesChange, onRetry, isRetrying }) {
  const [attributes, setAttributes] = useState({
    category: aiData?.category || "other",
    primary_color: aiData?.primary_color || "",
    secondary_colors: (aiData?.secondary_colors || []).join(", "),
    brand: aiData?.brand || "",
    material: aiData?.material || "",
    shape_or_form: aiData?.shape_or_form || "",
    distinctive_features: (aiData?.distinctive_features || []).join(", "),
    text_visible: aiData?.text_visible || "",
    condition: aiData?.condition || "good",
    description: aiData?.description || "",
    confidence: aiData?.confidence || 0.8
  });

  useEffect(() => {
    if (aiData) {
      setAttributes({
        category: aiData.category || "other",
        primary_color: aiData.primary_color || "",
        secondary_colors: Array.isArray(aiData.secondary_colors) ? aiData.secondary_colors.join(", ") : (aiData.secondary_colors || ""),
        brand: aiData.brand || "",
        material: aiData.material || "",
        shape_or_form: aiData.shape_or_form || "",
        distinctive_features: Array.isArray(aiData.distinctive_features) ? aiData.distinctive_features.join(", ") : (aiData.distinctive_features || ""),
        text_visible: aiData.text_visible || "",
        condition: aiData.condition || "good",
        description: aiData.description || "",
        confidence: aiData.confidence || 0.8
      });
    }
  }, [aiData]);

  const handleChange = (field, value) => {
    const updated = { ...attributes, [field]: value };
    setAttributes(updated);

    if (onAttributesChange) {
      onAttributesChange({
        ...updated,
        secondary_colors: updated.secondary_colors.split(",").map((s) => s.trim()).filter(Boolean),
        distinctive_features: updated.distinctive_features.split(",").map((s) => s.trim()).filter(Boolean)
      });
    }
  };

  const confidencePercent = Math.round((attributes.confidence || 0.8) * 100);

  return (
    <div className="ai-analysis-card card">
      <div className="card-header flex-between">
        <div>
          <h3>🤖 AI Visual Attribute Breakdown</h3>
          <p className="muted small">Review and adjust the extracted features below to ensure max matching accuracy.</p>
        </div>
        <div className="confidence-pill">
          <span>AI Confidence: </span>
          <strong>{confidencePercent}%</strong>
        </div>
      </div>

      <div className="attributes-grid">
        <label className="field-group">
          <span className="label-text">Category</span>
          <select
            value={attributes.category}
            onChange={(e) => handleChange("category", e.target.value)}
          >
            <option value="wallet">Wallet</option>
            <option value="phone">Phone</option>
            <option value="bag">Bag / Backpack</option>
            <option value="keys">Keys</option>
            <option value="watch">Watch</option>
            <option value="laptop">Laptop</option>
            <option value="documents">Documents / ID</option>
            <option value="jewellery">Jewellery</option>
            <option value="clothing">Clothing</option>
            <option value="eyewear">Eyewear / Glasses</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="field-group">
          <span className="label-text">Primary Color</span>
          <input
            type="text"
            value={attributes.primary_color}
            onChange={(e) => handleChange("primary_color", e.target.value)}
            placeholder="e.g. Dark Brown, Matte Black"
          />
        </label>

        <label className="field-group">
          <span className="label-text">Secondary Colors (comma separated)</span>
          <input
            type="text"
            value={attributes.secondary_colors}
            onChange={(e) => handleChange("secondary_colors", e.target.value)}
            placeholder="e.g. Tan, Silver trim"
          />
        </label>

        <label className="field-group">
          <span className="label-text">Brand / Manufacturer</span>
          <input
            type="text"
            value={attributes.brand}
            onChange={(e) => handleChange("brand", e.target.value)}
            placeholder="e.g. Fossil, Apple, Jansport"
          />
        </label>

        <label className="field-group">
          <span className="label-text">Material</span>
          <input
            type="text"
            value={attributes.material}
            onChange={(e) => handleChange("material", e.target.value)}
            placeholder="e.g. Leather, Aluminium, Canvas"
          />
        </label>

        <label className="field-group">
          <span className="label-text">Shape / Form</span>
          <input
            type="text"
            value={attributes.shape_or_form}
            onChange={(e) => handleChange("shape_or_form", e.target.value)}
            placeholder="e.g. Rectangular bi-fold"
          />
        </label>

        <label className="field-group">
          <span className="label-text">Condition</span>
          <select
            value={attributes.condition}
            onChange={(e) => handleChange("condition", e.target.value)}
          >
            <option value="new">New / Mint</option>
            <option value="good">Good</option>
            <option value="worn">Worn</option>
            <option value="damaged">Damaged / Cracked</option>
          </select>
        </label>

        <label className="field-group wide">
          <span className="label-text">Visible Text / Engravings / Serial Numbers</span>
          <input
            type="text"
            value={attributes.text_visible}
            onChange={(e) => handleChange("text_visible", e.target.value)}
            placeholder="e.g. Engraved name 'John Doe', Serial #SN-9981"
          />
          <small className="muted font-xs">Sensitive serial numbers are hidden from public listings and used solely for matching.</small>
        </label>

        <label className="field-group wide">
          <span className="label-text">Distinctive Features (comma separated)</span>
          <input
            type="text"
            value={attributes.distinctive_features}
            onChange={(e) => handleChange("distinctive_features", e.target.value)}
            placeholder="e.g. Scratched corner, Blue keychain attached, Sticker on back"
          />
        </label>

        <label className="field-group wide">
          <span className="label-text">AI Object Description</span>
          <textarea
            rows={2}
            value={attributes.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="One natural sentence describing the object visual details..."
          />
        </label>
      </div>

      {onRetry && (
        <div className="reanalyze-row">
          <button
            type="button"
            className="button ghost small"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? "Re-analyzing with Groq Vision…" : "🔄 Re-run AI Vision Extraction"}
          </button>
        </div>
      )}
    </div>
  );
}
