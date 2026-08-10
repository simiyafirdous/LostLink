import { useState, useEffect } from "react";
import { getItemMatches } from "../api/matches";

export function useMatches(itemId) {
  const [matches, setMatches] = useState([]);
  const [targetItem, setTargetItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`dismissed_matches_${itemId}`) || "[]");
    } catch (e) {
      return [];
    }
  });

  const loadMatches = async () => {
    if (!itemId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getItemMatches(itemId);
      setTargetItem(data.targetItem);
      setMatches(data.matches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [itemId]);

  const dismissMatch = (candidateId) => {
    const updated = [...dismissedIds, candidateId];
    setDismissedIds(updated);
    try {
      localStorage.setItem(`dismissed_matches_${itemId}`, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist dismissed match", e);
    }
  };

  const visibleMatches = matches.filter((m) => !dismissedIds.includes(m._id));

  return {
    matches: visibleMatches,
    allMatches: matches,
    targetItem,
    loading,
    error,
    refetch: loadMatches,
    dismissMatch
  };
}
