"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const REPORTS = [
  { href: "/dashboard", label: "Daily Performance" },
  { href: "/room-occupancy", label: "Room Occupancy" },
  { href: "/doctor-performance", label: "Doctor Performance" },
  { href: "/volume-trends", label: "Volume Trends" },
];

export default function Navigation({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50" style={{ background: "#0a1517", borderBottom: "1px solid #22393c" }}>
      <div className="max-w-[1180px] mx-auto flex items-center gap-3 flex-wrap px-4 py-2">
        <span className="text-[10px] tracking-widest uppercase whitespace-nowrap" style={{ color: "#6c8683" }}>
          Asiri Health Reports
        </span>
        <div className="flex gap-1.5 flex-wrap flex-1">
          {REPORTS.map((r) => (
            <NavLink key={r.href} href={r.href} label={r.label} active={pathname.startsWith(r.href)} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11.5px]" style={{ color: "var(--text-dim)" }}>
            {userName}
          </span>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
      style={
        active
          ? { background: "#1e8c82", color: "#08211f" }
          : { background: "#132528", border: "1px solid #22393c", color: "#9fb6b3" }
      }
    >
      {label}
    </Link>
  );
}
