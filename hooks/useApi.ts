"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Small fetch hook shared by every report page: tracks loading / error / no-data
 * per section 9 of the brief ("Common dashboard features"). Re-fetches whenever
 * `url` changes; pass `null` to skip fetching (e.g. while required filters are unset).
 */
export function useApi<T>(url: string | null): UseApiState<T> & { refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(() => {
    if (!url) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    fetch(url)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
        return body as T;
      })
      .then((body) => {
        if (id === requestId.current) {
          setData(body);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (id === requestId.current) {
          setError(err.message || "Something went wrong.");
          setLoading(false);
        }
      });
  }, [url]);

  useEffect(() => {
    // Intentional: this hook's entire job is to synchronize component state with
    // a fetch triggered by `url` changing — the standard data-fetching-in-effect
    // pattern that `set-state-in-effect` flags by design (it nudges toward a
    // fetching library instead). No such library is in scope for this MVP.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
