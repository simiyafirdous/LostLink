import { useState, useEffect } from "react";
import { getItem } from "../api/items";

/**
 * Hook to poll item AI analysis status until completed ('done') or 'failed'.
 * Polls every 2000ms up to maxDurationMs (default 30,000ms).
 */
export function useItemAnalysis(itemId, maxDurationMs = 30000) {
  const [item, setItem] = useState(null);
  const [aiStatus, setAiStatus] = useState("pending"); // 'pending' | 'done' | 'failed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!itemId) return;

    let isMounted = true;
    let timerId = null;
    const startTime = Date.now();

    const fetchStatus = async () => {
      try {
        const data = await getItem(itemId);
        if (!isMounted) return;

        const currentItem = data.item;
        setItem(currentItem);
        const status = currentItem?.aiStatus || "done";
        setAiStatus(status);
        setLoading(false);

        const elapsedTime = Date.now() - startTime;
        if (status === "pending" && elapsedTime < maxDurationMs) {
          timerId = setTimeout(fetchStatus, 2000);
        } else if (status === "pending" && elapsedTime >= maxDurationMs) {
          setAiStatus("failed");
          setError("AI extraction timed out. Please review details manually.");
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message);
        setAiStatus("failed");
        setLoading(false);
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [itemId, maxDurationMs]);

  return { item, setItem, aiStatus, loading, error };
}
