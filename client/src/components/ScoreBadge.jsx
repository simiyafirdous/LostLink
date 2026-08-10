export default function ScoreBadge({ score = 0 }) {
  const numScore = Math.round(Number(score) || 0);

  let variantClass = "score-grey";
  let label = "Low Match";

  if (numScore >= 75) {
    variantClass = "score-green";
    label = "High Match";
  } else if (numScore >= 55) {
    variantClass = "score-amber";
    label = "Possible Match";
  }

  return (
    <div className={`score-badge ${variantClass}`}>
      <span className="score-number">{numScore}%</span>
      <span className="score-label">{label}</span>
    </div>
  );
}
