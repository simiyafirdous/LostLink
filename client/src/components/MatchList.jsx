import MatchCard from "./MatchCard";

export default function MatchList({ matches = [], onInitiateClaim, onDismiss }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="card empty-matches-card text-center p-6">
        <div className="empty-icon font-xl">🔍</div>
        <h3>No Plausible Matches Found Yet</h3>
        <p className="muted max-w-md mx-auto">
          We scanned open reports in this category and region. Don’t worry — as soon as someone posts a report matching your item’s visual attributes, our Groq Vision engine will notify you automatically!
        </p>
      </div>
    );
  }

  return (
    <div className="matches-list flex-col gap-4">
      {matches.map((match) => (
        <MatchCard
          key={match._id}
          match={match}
          onInitiateClaim={onInitiateClaim}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
