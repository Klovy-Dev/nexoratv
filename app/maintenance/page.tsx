import type { Metadata } from "next";

export const metadata: Metadata = { title: "Maintenance en cours" };
export const dynamic = "force-dynamic";

export default function MaintenancePage() {
  return (
    <section className="hero" style={{ minHeight: "70vh", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ textAlign: "center", maxWidth: 640 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-full.png"
          alt="NexoraTV"
          width={120}
          height={120}
          style={{ display: "block", margin: "0 auto 24px", width: 120, height: 120, borderRadius: 26 }}
        />
        <span className="eyebrow">Maintenance en cours</span>
        <h1>
          On revient <span className="gradient-text">dans 2 jours</span> avec
          des nouveautés
        </h1>
        <p className="lead">
          NexoraTV est en cours de mise à jour pour vous proposer une
          meilleure expérience. Le site sera de nouveau disponible sous 48h.
          Merci de votre patience !
        </p>
      </div>
    </section>
  );
}
