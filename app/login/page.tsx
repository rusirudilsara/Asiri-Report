"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign-in failed.");
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center font-display font-bold text-lg"
          style={{ background: "linear-gradient(135deg, var(--teal), var(--gold))", color: "#06181c" }}
        >
          A
        </div>
        <div>
          <div className="text-[11px] tracking-widest uppercase" style={{ color: "var(--text-faint)" }}>
            Asiri Health · Group Reporting
          </div>
          <div className="font-display text-lg">Daily Reporting System</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>
            Email
          </label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full"
            placeholder="you@asirihealth.com"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="text-[12.5px] rounded-lg px-3 py-2" style={{ background: "rgba(217,99,74,0.12)", color: "var(--bad)" }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-4 py-2.5 font-semibold text-[13.5px] mt-1 disabled:opacity-60"
          style={{ background: "var(--teal)", color: "#06181c" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-[11.5px] mt-6 text-center" style={{ color: "var(--text-faint)" }}>
        MVP demonstration build — access is limited to approved management and IT users.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
