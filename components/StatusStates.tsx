export function LoadingState({ label = "Loading report data…" }: { label?: string }) {
  return (
    <div className="card p-8 flex items-center justify-center gap-3" style={{ color: "var(--text-dim)" }}>
      <span
        className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--border)", borderTopColor: "var(--teal-light)" }}
      />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="card p-6 flex items-center justify-between gap-4 flex-wrap"
      style={{ borderColor: "rgba(217,99,74,0.35)", background: "rgba(217,99,74,0.06)" }}
    >
      <div>
        <div className="text-[13px] font-semibold" style={{ color: "var(--bad)" }}>
          Couldn&apos;t load this report
        </div>
        <div className="text-[12px] mt-1" style={{ color: "var(--text-dim)" }}>
          {message}
        </div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="chip">
          Retry
        </button>
      )}
    </div>
  );
}

export function NoDataState({ message = "No data available for this selection." }: { message?: string }) {
  return (
    <div className="card p-8 text-center" style={{ color: "var(--text-dim)" }}>
      <div className="text-[13.5px] font-semibold mb-1" style={{ color: "var(--text)" }}>
        Nothing to show yet
      </div>
      <div className="text-[12px]">{message}</div>
    </div>
  );
}

export function LastUpdated({ iso }: { iso: string | null }) {
  if (!iso) return null;
  const d = new Date(iso);
  return (
    <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>
      Data last refreshed: {d.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}
    </div>
  );
}
