import { useState, useEffect } from "react";
import { getIncomingClaims, updateClaimStatus } from "../api/claims";

export default function ClaimsInbox() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadIncoming = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getIncomingClaims();
      setClaims(data.claims || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncoming();
  }, []);

  const handleReview = async (claimId, status) => {
    setUpdatingId(claimId);
    try {
      const response = await updateClaimStatus(claimId, status);
      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? response.claim : c))
      );
    } catch (err) {
      alert("Action failed: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="claims-inbox-page max-w-4xl mx-auto">
      <div className="page-header mb-6">
        <p className="eyebrow">FINDER INBOX</p>
        <h2>Incoming Ownership Claims</h2>
        <p className="muted">Review verification answers from users claiming items you found.</p>
      </div>

      {error && <div className="error-banner mb-4">{error}</div>}

      {loading ? (
        <p className="loading">Loading incoming claims…</p>
      ) : claims.length === 0 ? (
        <div className="card p-8 text-center">
          <h3>No Pending Claims</h3>
          <p className="muted">You currently have no incoming claims to review.</p>
        </div>
      ) : (
        <div className="claims-list flex-col gap-4">
          {claims.map((claim) => (
            <article className="card p-5" key={claim._id}>
              <div className="flex-between align-start mb-3">
                <div>
                  <small className="tag-found">FOUND ITEM REPORT</small>
                  <h3>{claim.foundItem?.name || "Found Item"}</h3>
                  <p className="muted small">
                    Claimed by: <strong>{claim.claimant?.name || "User"}</strong> ({claim.claimant?.email})
                  </p>
                </div>
                <span className={`status-pill status-${claim.status}`}>{claim.status?.toUpperCase()}</span>
              </div>

              {Array.isArray(claim.verificationAnswers) && claim.verificationAnswers.length > 0 && (
                <div className="verification-responses-box p-3 bg-subtle rounded mb-4">
                  <h4 className="small bold mb-2">🔒 Claimant's Verification Responses:</h4>
                  {claim.verificationAnswers.map((ans, idx) => (
                    <div key={idx} className="mb-2">
                      <p className="font-xs bold text-muted">{ans.question}</p>
                      <p className="small italic text-body">"{ans.answer}"</p>
                    </div>
                  ))}
                </div>
              )}

              {claim.message && (
                <p className="claim-message mb-3">
                  <strong>Message:</strong> {claim.message}
                </p>
              )}

              {claim.status === "pending" && (
                <div className="flex-row justify-end gap-3 mt-4 border-t pt-3">
                  <button
                    type="button"
                    className="button danger small"
                    disabled={updatingId === claim._id}
                    onClick={() => handleReview(claim._id, "rejected")}
                  >
                    {updatingId === claim._id ? "Processing…" : "Reject Claim"}
                  </button>
                  <button
                    type="button"
                    className="button primary small"
                    disabled={updatingId === claim._id}
                    onClick={() => handleReview(claim._id, "approved")}
                  >
                    {updatingId === claim._id ? "Processing…" : "Approve Claim & Share Contact Info"}
                  </button>
                </div>
              )}

              {claim.status === "approved" && (
                <div className="success-banner mt-3 p-3 text-xs">
                  ✅ Claim Approved. Contact info exchanged with claimant.
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
