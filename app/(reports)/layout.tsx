import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";
import Navigation from "@/components/Navigation";

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Defense in depth — middleware already redirects unauthenticated requests,
  // but Server Components should never assume that ran.
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navigation userName={session.name} />
      <main className="flex-1 max-w-[1180px] w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
