import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const user = await getCurrentUser();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Support</span>
          <h1>
            Une question ? <span className="gradient-text">Écrivez-nous</span>
          </h1>
          <p className="lead" style={{ marginInline: "auto" }}>
            Notre équipe répond sous 24 h ouvrées, 7j/7 pour les urgences
            techniques.
          </p>
        </div>
      </section>

      <section style={{ paddingTop: 40 }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="auth-card reveal" style={{ maxWidth: "none" }}>
            <ContactForm
              defaultName={user?.name ?? ""}
              defaultEmail={user?.email ?? ""}
            />
            <p className="auth-switch">
              Vous pouvez aussi consulter la{" "}
              <Link href="/tuto#faq">FAQ du tuto</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
