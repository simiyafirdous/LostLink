import { useState, useEffect } from "react";
import { getVerifyQuestions } from "../api/matches";
import { createClaim } from "../api/claims";

export default function ClaimModal({ matchItem, myLostItemId, onClose, onSuccess }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [additionalMessage, setAdditionalMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!matchItem?._id) return;
    setLoading(true);
    setError("");

    getVerifyQuestions(matchItem._id)
      .then((data) => {
        setQuestions(data.questions || []);
        const initialAnswers = {};
        (data.questions || []).forEach((q, idx) => {
          initialAnswers[idx] = "";
        });
        setAnswers(initialAnswers);
      })
      .catch((err) => {
        setError("Failed to load verification questions: " + err.message);
      })
      .finally(() => setLoading(false));
  }, [matchItem]);

  const handleAnswerChange = (index, value) => {
    setAnswers({ ...answers, [index]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const formattedAnswers = questions.map((q, idx) => ({
      question: q,
      answer: answers[idx] || "Not answered"
    }));

    try {
      await createClaim({
        foundItemId: matchItem._id,
        lostItemId: myLostItemId || null,
        matchScore: matchItem.score || 0,
        verificationAnswers: formattedAnswers,
        message: additionalMessage || "Claim initiated with verification details.",
        proofDetails: formattedAnswers.map((a) => `${a.question}: ${a.answer}`).join("\n")
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!matchItem) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content card max-w-lg">
        <div className="flex-between align-center mb-4">
          <h2>Submit Ownership Claim</h2>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="claim-item-summary mb-4 p-3 bg-subtle rounded">
          <strong>Claiming: {matchItem.name}</strong>
          <p className="muted small">Item found at {matchItem.locationText || "campus location"}</p>
        </div>

        {error && <div className="error-banner mb-4">{error}</div>}

        {loading ? (
          <div className="p-4 text-center">
            <p className="loading">Generating AI verification questions…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-col gap-4">
            <div className="questions-block">
              <p className="small bold mb-2 text-primary">
                🔒 Security Step: Answer these verification questions to prove ownership. Only the finder can view your answers.
              </p>

              {questions.map((q, idx) => (
                <div key={idx} className="field-group mb-3">
                  <label className="label-text font-semibold">{q}</label>
                  <textarea
                    required
                    rows={2}
                    value={answers[idx] || ""}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    placeholder="Provide exact details only the true owner would know…"
                  />
                </div>
              ))}
            </div>

            <div className="field-group">
              <label className="label-text">Additional message for finder (optional)</label>
              <textarea
                rows={2}
                value={additionalMessage}
                onChange={(e) => setAdditionalMessage(e.target.value)}
                placeholder="e.g. Best contact time or additional proof..."
              />
            </div>

            <div className="flex-row justify-end gap-2 mt-2">
              <button type="button" className="button ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="button primary" disabled={submitting}>
                {submitting ? "Submitting claim…" : "Submit Claim for Verification"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
