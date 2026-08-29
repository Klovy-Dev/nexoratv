import type { ReactNode } from "react";
import DocsSidebar from "@/components/DocsSidebar";
import DocsBreadcrumb from "@/components/DocsBreadcrumb";

export default function TutoLayout({ children }: { children: ReactNode }) {
  return (
    <section className="docs-shell">
      <div className="container">
        <DocsBreadcrumb />
        <div className="docs-layout">
          <DocsSidebar />
          {children}
        </div>
      </div>
    </section>
  );
}
