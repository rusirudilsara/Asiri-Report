"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60"
      style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
