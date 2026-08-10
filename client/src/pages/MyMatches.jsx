import { useState, useEffect } from "react";
import { getMyItems } from "../api/items";
import { useMatches } from "../hooks/useMatches";
import MatchList from "../components/MatchList";
import ClaimModal from "../components/ClaimModal";

function ItemMatchesSection({ item }) {
  const { matches, loading, error, dismissMatch } = useMatches(item._id);
  const [claimingMatch, setClaimingMatch] = useState(null);

  return (
    <div className="item-matches-section mb-8">
      <div className="section-header flex-between mb-3 border-b pb-2">
        <div>
          <h3>{item.name}</h3>
          <p className="muted small">
            {item.category} · Reported {new Date(item.incidentDate || item.date).toLocaleDateString()}
          </p>
        </div>
        <span className={`tag-${item.type || item.reportType}`}>{(item.type || item.reportType)?.toUpperCase()}</span>
      </div>

      {loading ? (
        <p className="loading small">Searching for matches with Groq Vision engine…</p>
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : (
        <MatchList
          matches={matches}
          onInitiateClaim={(match) => setClaimingMatch(match)}
          onDismiss={(candidateId) => dismissMatch(candidateId)}
        />
      )}

      {claimingMatch && (
        <ClaimModal
          matchItem={claimingMatch}
          myLostItemId={item._id}
          onClose={() => setClaimingMatch(null)}
          onSuccess={() => {
            setClaimingMatch(null);
            alert("Claim submitted successfully!");
          }}
        />
      )}
    </div>
  );
}

export default function MyMatches() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyItems()
      .then((data) => setItems(data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="my-matches-page max-w-4xl mx-auto">
      <div className="page-header mb-6">
        <p className="eyebrow">AI MATCH DASHBOARD</p>
        <h2>My Item Match Suggestions</h2>
        <p className="muted">Ranked matches for your reported lost and found items.</p>
      </div>

      {error && <div className="error-banner mb-4">{error}</div>}

      {loading ? (
        <p className="loading">Loading your reports…</p>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center">
          <h3>No Active Reports</h3>
          <p className="muted">Submit a lost or found item report to get AI-powered visual match suggestions.</p>
        </div>
      ) : (
        items.map((item) => <ItemMatchesSection key={item._id} item={item} />)
      )}
    </section>
  );
}
