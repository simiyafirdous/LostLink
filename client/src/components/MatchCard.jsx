import ScoreBadge from "./ScoreBadge";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

export default function MatchCard({ match, onInitiateClaim, onDismiss }) {
  const imageUrl = match.imageUrl
    ? (match.imageUrl.startsWith("http") ? match.imageUrl : `${API_BASE}${match.imageUrl}`)
    : null;

  return (
    <article className="card match-card flex-row gap-4">
      <div className="match-thumbnail-box">
        {imageUrl ? (
          <img src={imageUrl} alt={match.name} className="match-img" />
        ) : (
          <div className="no-img-placeholder">📷</div>
        )}
        <span className={`type-tag tag-${match.type}`}>{match.type?.toUpperCase()}</span>
      </div>

      <div className="match-content flex-col flex-1">
        <div className="flex-between align-start">
          <div>
            <h3 className="match-title">{match.name}</h3>
            <p className="muted small">
              {match.category} · 📍 {match.locationText || "Campus location"} · 🗓️ {new Date(match.incidentDate).toLocaleDateString()}
            </p>
          </div>
          <ScoreBadge score={match.score} />
        </div>

        <p className="match-desc">{match.description}</p>

        {Array.isArray(match.matchReasons) && match.matchReasons.length > 0 && (
          <div className="reasons-chips-list">
            {match.matchReasons.map((reason, idx) => (
              <span className="chip chip-match-reason" key={idx}>
                ✓ {reason}
              </span>
            ))}
          </div>
        )}

        <div className="match-actions-row flex-row justify-end gap-2 mt-auto">
          {onDismiss && (
            <button
              type="button"
              className="button ghost small text-muted"
              onClick={() => onDismiss(match._id)}
            >
              Not a match
            </button>
          )}
          {onInitiateClaim && (
            <button
              type="button"
              className="button small primary"
              onClick={() => onInitiateClaim(match)}
            >
              This is mine (Claim)
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
