import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "../components/ImageUploader";
import AIAnalysisCard from "../components/AIAnalysisCard";
import LocationPicker from "../components/LocationPicker";
import { createItem, updateItem, reanalyzeItem } from "../api/items";

export default function PostItem({ type = "lost" }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Upload, 2: AI Analysis, 3: Details

  // Form states
  const [imageFile, setImageFile] = useState(null);
  const [createdItemId, setCreatedItemId] = useState(null);

  const [aiData, setAiData] = useState(null);
  const [aiStatus, setAiStatus] = useState("pending"); // 'pending' | 'done' | 'failed'
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "other",
    locationText: "",
    coordinates: [0, 0],
    incidentDate: new Date().toISOString().split("T")[0],
    color: "",
    brand: "",
    socialMediaUrl: ""
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Step 1 -> Step 2: Upload photo and create initial draft with AI extraction
  const handleStep1Next = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      // If no photo uploaded, jump straight to details
      setStep(3);
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("reportType", type);
      formData.append("name", form.name || `${type === "lost" ? "Lost" : "Found"} Item`);
      formData.append("description", form.description || "Reported item");
      formData.append("category", form.category || "other");
      formData.append("image", imageFile);

      const response = await createItem(formData);
      const item = response.item;
      setCreatedItemId(item._id);

      // Set initial values derived from AI
      if (item.ai) {
        setAiData(item.ai);
        setForm((prev) => ({
          ...prev,
          category: item.ai.category || prev.category,
          color: item.ai.primary_color || prev.color,
          brand: item.ai.brand || prev.brand,
          name: prev.name || item.name
        }));
      }
      setAiStatus(item.aiStatus || "done");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2 -> Step 3: Attributes confirmed
  const handleStep2Next = () => {
    setStep(3);
  };

  const handleRetryAI = async () => {
    if (!createdItemId) return;
    setIsAnalyzing(true);
    setError("");
    try {
      const response = await reanalyzeItem(createdItemId);
      if (response.item?.ai) {
        setAiData(response.item.ai);
        setAiStatus("done");
      }
    } catch (err) {
      setError("Re-analysis failed: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Final Step 3 Submission
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        color: form.color,
        brand: form.brand,
        locationText: form.locationText,
        coordinates: form.coordinates,
        incidentDate: form.incidentDate,
        date: form.incidentDate,
        socialMediaUrl: form.socialMediaUrl,
        ai: aiData
      };

      if (createdItemId) {
        await updateItem(createdItemId, payload);
        navigate(`/items/${createdItemId}`);
      } else {
        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (typeof v === "object") formData.append(k, JSON.stringify(v));
          else formData.append(k, v);
        });
        formData.append("type", type);
        formData.append("reportType", type);
        if (imageFile) formData.append("image", imageFile);

        const res = await createItem(formData);
        navigate(`/items/${res.item._id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="form-page max-w-2xl mx-auto">
      <div className="page-header mb-6">
        <p className="eyebrow">STEP {step} OF 3</p>
        <h2>Report a {type === "lost" ? "Lost" : "Found"} Item</h2>
        
        {/* Progress indicator */}
        <div className="progress-bar-container mt-3">
          <div className={`step-node ${step >= 1 ? "active" : ""}`}>1. Upload Photo</div>
          <div className={`step-node ${step >= 2 ? "active" : ""}`}>2. AI Analysis</div>
          <div className={`step-node ${step >= 3 ? "active" : ""}`}>3. Confirm Details</div>
        </div>
      </div>

      {error && <div className="error-banner mb-4">{error}</div>}

      {/* STEP 1: Upload Photo */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="card p-6 flex-col gap-4">
          <h3>Step 1: Upload Item Photo</h3>
          <p className="muted small">
            Upload a clear photo of the item. Our Groq Vision AI model will automatically analyze visual features (color, brand, serial numbers, shape) for matching.
          </p>

          <ImageUploader
            onImageSelected={(file) => setImageFile(file)}
          />

          <div className="field-group mt-2">
            <label className="label-text">Item Name / Headline</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Brown Leather Fossil Wallet, Black iPhone 14"
            />
          </div>

          <div className="flex-row justify-end gap-3 mt-4">
            <button type="submit" className="button primary" disabled={isAnalyzing}>
              {isAnalyzing ? "Analyzing photo with Groq Vision…" : "Continue to AI Analysis →"}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: AI Analysis & Verification */}
      {step === 2 && (
        <div className="flex-col gap-4">
          {isAnalyzing ? (
            <div className="card p-8 text-center">
              <div className="spinner mb-3 font-xl">🤖</div>
              <h3>Analyzing photo attributes with Groq Vision…</h3>
              <p className="muted small">Extracting category, colors, brand, material, serial numbers, and condition.</p>
            </div>
          ) : (
            <>
              {aiStatus === "failed" && (
                <div className="warning-banner mb-3">
                  ⚠️ AI attribute extraction encountered an issue. You can manually set attributes below or click retry.
                </div>
              )}

              <AIAnalysisCard
                aiData={aiData}
                onAttributesChange={(updatedAi) => {
                  setAiData(updatedAi);
                  setForm((prev) => ({
                    ...prev,
                    category: updatedAi.category || prev.category,
                    color: updatedAi.primary_color || prev.color,
                    brand: updatedAi.brand || prev.brand
                  }));
                }}
                onRetry={handleRetryAI}
                isRetrying={isAnalyzing}
              />

              <div className="flex-row justify-between mt-4">
                <button type="button" className="button ghost" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button type="button" className="button primary" onClick={handleStep2Next}>
                  Confirm Attributes & Continue →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 3: Incident Details */}
      {step === 3 && (
        <form onSubmit={handleFinalSubmit} className="card p-6 flex-col gap-4">
          <h3>Step 3: Incident Location & Date</h3>
          <p className="muted small">Provide where and when the item was lost or found to complete registration.</p>

          <LocationPicker
            locationText={form.locationText}
            coordinates={form.coordinates}
            onChange={({ locationText, coordinates }) => {
              setForm({ ...form, locationText, coordinates });
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="field-group">
              <label className="label-text">Date {type === "lost" ? "Lost" : "Found"}</label>
              <input
                type="date"
                required
                value={form.incidentDate}
                onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
              />
            </div>

            <div className="field-group">
              <label className="label-text">Category</label>
              <input
                type="text"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>

          <div className="field-group">
            <label className="label-text">Full Description & Identifying Notes</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe any unique contents, circumstances, or details..."
            />
          </div>

          {type === "found" && (
            <div className="field-group">
              <label className="label-text">Public social-media post URL (optional)</label>
              <input
                type="url"
                value={form.socialMediaUrl}
                onChange={(e) => setForm({ ...form, socialMediaUrl: e.target.value })}
                placeholder="https://instagram.com/p/..."
              />
              <small className="muted font-xs">Supporting information only; never proves ownership.</small>
            </div>
          )}

          <div className="flex-row justify-between mt-4">
            <button type="button" className="button ghost" onClick={() => setStep(2)}>
              ← Back to AI Attributes
            </button>
            <button type="submit" className="button primary" disabled={submitting}>
              {submitting ? "Submitting Report…" : "Submit & View Possible Matches 🚀"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
