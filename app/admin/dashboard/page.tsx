import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { dashboardStats, type DashboardDay, type DashboardMetric } from "@/lib/dashboard";
import { formatPrice } from "@/lib/validation";

export const metadata: Metadata = { title: "Dashboard — Administration" };
export const dynamic = "force-dynamic";

const nf = new Intl.NumberFormat("fr-FR");

function shortDay(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function longDay(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Paris",
  });
}

/** Tendance vs les 24 h précédentes : flèche + texte, jamais la couleur seule. */
function Trend({ m, money = false }: { m: DashboardMetric; money?: boolean }) {
  const diff = m.last24h - m.prev24h;
  if (diff === 0) return <span className="dash-trend">= stable vs 24 h avant</span>;
  const up = diff > 0;
  const abs = money ? formatPrice(Math.abs(diff)) : nf.format(Math.abs(diff));
  return (
    <span className={`dash-trend ${up ? "up" : "down"}`}>
      {up ? "▲ +" : "▼ −"}
      {abs} vs 24 h avant
    </span>
  );
}

function Kpi({
  label,
  m,
  money = false,
}: {
  label: string;
  m: DashboardMetric;
  money?: boolean;
}) {
  const fmt = (v: number) => (money ? formatPrice(v) : nf.format(v));
  return (
    <div className="stat dash-kpi">
      <span className="dash-kpi-label">{label}</span>
      <strong>{fmt(m.last24h)}</strong>
      <Trend m={m} money={money} />
      <span className="dash-kpi-sub">
        7 j : {fmt(m.last7d)} · 30 j : {fmt(m.last30d)}
      </span>
    </div>
  );
}

/** Histogramme d'une seule série sur les N derniers jours (survol = valeur). */
function DailyBars({
  title,
  days,
  value,
  money = false,
}: {
  title: string;
  days: DashboardDay[];
  value: (d: DashboardDay) => number;
  money?: boolean;
}) {
  const values = days.map(value);
  const max = Math.max(...values, 0);
  const total = values.reduce((a, b) => a + b, 0);
  const fmt = (v: number) => (money ? formatPrice(v) : nf.format(v));

  return (
    <figure className="dash-chart">
      <figcaption>
        <span>{title}</span>
        <span className="muted">
          {fmt(total)} sur {days.length} j
        </span>
      </figcaption>
      <div className="dash-plot">
        <span className="dash-max">{fmt(max)}</span>
        <div className="dash-bars" role="img" aria-label={`${title}, ${days.length} derniers jours`}>
          {days.map((d, i) => {
            const v = values[i];
            const h = max > 0 ? Math.max((v / max) * 100, v > 0 ? 3 : 0) : 0;
            return (
              <div key={d.day} className="dash-col" tabIndex={0} data-tip={`${longDay(d.day)} · ${fmt(v)}`}>
                <div className="dash-bar" style={{ height: `${h}%` }} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="dash-axis">
        <span>{shortDay(days[0]?.day ?? "")}</span>
        <span>{shortDay(days[days.length - 1]?.day ?? "")}</span>
      </div>
    </figure>
  );
}

export default async function DashboardPage() {
  await requireAdmin();
  const s = await dashboardStats(14);
  const noTraffic = s.views.last30d === 0;

  return (
    <section>
      <div className="container">
        <p className="lead" style={{ marginBottom: 20 }}>
          Activité des <strong>dernières 24 h</strong> (glissantes), comparée aux 24 h
          d&apos;avant.
        </p>

        <div className="stat-row dash-kpis">
          <Kpi label="Inscriptions" m={s.signups} />
          <Kpi label="Visiteurs uniques" m={s.visitors} />
          <Kpi label="Pages vues" m={s.views} />
          <Kpi label="Commandes passées" m={s.orders} />
          <Kpi label="Commandes payées" m={s.paidOrders} />
          <Kpi label="Chiffre d'affaires" m={s.revenueCents} money />
        </div>

        <div className="stat-row">
          <Link href="/admin/commandes" className="stat dash-now">
            <strong>{nf.format(s.pendingOrders)}</strong>
            <span>Commandes à valider →</span>
          </Link>
          <div className="stat dash-now">
            <strong>{nf.format(s.activeSubs)}</strong>
            <span>Abonnements actifs</span>
          </div>
          <div className="stat dash-now">
            <strong>{nf.format(s.activeTrials)}</strong>
            <span>Essais 24 h en cours</span>
          </div>
          <div className="stat dash-now">
            <strong>{nf.format(s.totalClients)}</strong>
            <span>Clients inscrits au total</span>
          </div>
        </div>

        <div className="panel">
          <h2>14 derniers jours</h2>
          {noTraffic && (
            <p className="muted" style={{ marginBottom: 16 }}>
              La mesure des visites vient d&apos;être activée : les chiffres de
              visites se rempliront au fil des prochains jours.
            </p>
          )}
          <div className="dash-charts">
            <DailyBars title="Visiteurs uniques" days={s.days} value={(d) => d.visitors} />
            <DailyBars title="Inscriptions" days={s.days} value={(d) => d.signups} />
            <DailyBars title="Commandes passées" days={s.days} value={(d) => d.orders} />
            <DailyBars title="Chiffre d'affaires" days={s.days} value={(d) => d.revenueCents} money />
          </div>

          <details className="dash-details">
            <summary>Voir le détail jour par jour</summary>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Jour</th><th>Visiteurs</th><th>Pages vues</th><th>Inscriptions</th>
                    <th>Commandes</th><th>Payées</th><th>CA</th>
                  </tr>
                </thead>
                <tbody>
                  {[...s.days].reverse().map((d) => (
                    <tr key={d.day}>
                      <td>{longDay(d.day)}</td>
                      <td>{nf.format(d.visitors)}</td>
                      <td>{nf.format(d.views)}</td>
                      <td>{nf.format(d.signups)}</td>
                      <td>{nf.format(d.orders)}</td>
                      <td>{nf.format(d.paidOrders)}</td>
                      <td>{formatPrice(d.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>

        <div className="panel">
          <h2>Pages les plus vues (7 j)</h2>
          {s.topPages.length === 0 ? (
            <p className="muted">Pas encore de visites enregistrées.</p>
          ) : (
            <ul className="dash-top">
              {s.topPages.map((p) => (
                <li key={p.path}>
                  <code>{p.path}</code>
                  <span
                    className="dash-top-bar"
                    style={{ width: `${(p.views / s.topPages[0].views) * 100}%` }}
                    aria-hidden
                  />
                  <strong>{nf.format(p.views)}</strong>
                </li>
              ))}
            </ul>
          )}
          <p className="hint" style={{ marginTop: 12 }}>
            Mesure sans cookie : les administrateurs et les robots ne sont pas comptés.
          </p>
        </div>
      </div>
    </section>
  );
}
