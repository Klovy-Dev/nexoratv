import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const me = await requireAdmin();

  return (
    <div className="admin-shell">
      <header className="admin-shell-header">
        <Link href="/admin" className="admin-shell-brand">
          Nexora<span>TV</span> <em>Admin</em>
        </Link>
        <div className="admin-shell-user">
          <span className="admin-shell-email">{me.email}</span>
          <Link href="/" className="btn btn-ghost btn-sm">
            ← Retour au site
          </Link>
        </div>
      </header>

      <div className="admin-shell-body">
        <AdminSidebar />
        <main className="admin-shell-main">{children}</main>
      </div>
    </div>
  );
}
