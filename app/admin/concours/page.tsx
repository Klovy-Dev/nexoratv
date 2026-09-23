import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { loadGoldenottCatalog } from "@/lib/goldenott-catalog";
import {
  CONTEST,
  contestLeaderboard,
  contestPhase,
  qualifyingPackageIds,
} from "@/lib/contest";
import { formatDate, formatDateTime } from "@/lib/validation";

export const metadata: Metadata = { title: "Concours — Administration" };
export const dynamic = "force-dynamic";

const PHASE_LABEL = {
  upcoming: "À venir",
  active: "En cours",
  ended: "Terminé",
  archived: "Terminé",
} as const;

export default async function AdminContestPage() {
  await requireAdmin();
  const catalog = await loadGoldenottCatalog();
  const packageIds = qualifyingPackageIds(catalog);
  const participants = await contestLeaderboard(packageIds);
  const phase = contestPhase();

  const totalSignups = participants.reduce((n, p) => n + p.referrals.length, 0);
  const totalQualified = participants.reduce((n, p) => n + p.score, 0);

  return (
    <section>
      <div className="container">
        <div className="panel">
          <h2>
            {CONTEST.title}{" "}
            <span className={`badge ${phase === "active" ? "badge-active" : ""}`}>
              {PHASE_LABEL[phase]}
            </span>
          </h2>
          <p className="muted">
            Du {CONTEST.startLabel} au {CONTEST.endLabel}. Un filleul compte s&apos;il
            s&apos;inscrit avec le lien concours pendant cette période et y paie une
            première offre d&apos;au moins 3 mois (essais, renouvellements et
            abonnements remboursés exclus). Il faut au moins {CONTEST.minReferrals}{" "}
            filleuls validés pour gagner ; en cas d&apos;égalité, le premier à avoir
            atteint son score passe devant.
          </p>
          <ol style={{ margin: "12px 0 0 20px" }}>
            {CONTEST.prizes.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
          <p style={{ marginTop: 12 }}>
            <Link href="/concours" className="btn btn-ghost btn-sm">
              Voir le règlement public
            </Link>
          </p>
          {catalog.error && (
            <p className="flash flash-error" style={{ marginTop: 12 }}>
              GoldenOTT injoignable ({catalog.error}) : les commandes ne peuvent pas
              être vérifiées, les scores affichés sont incomplets.
            </p>
          )}
        </div>

        <div className="stat-row">
          <div className="stat">
            <strong>{participants.length}</strong>
            <span>Parrains avec au moins un inscrit</span>
          </div>
          <div className="stat">
            <strong>{totalSignups}</strong>
            <span>Inscriptions via un lien concours</span>
          </div>
          <div className="stat">
            <strong>{totalQualified}</strong>
            <span>Filleuls validés (≥ 3 mois payés)</span>
          </div>
        </div>

        <div className="panel">
          <h2>Classement</h2>
          {participants.length === 0 ? (
            <p className="muted">
              {phase === "upcoming"
                ? `Le concours commence le ${CONTEST.startLabel}.`
                : "Aucune inscription via un lien concours pour le moment."}
            </p>
          ) : (
            <div className="contest-admin-list">
              {participants.map((p) => (
                <details key={p.userId} className="contest-admin-row" open={p.prize !== null}>
                  <summary>
                    <span className="contest-rank">{p.rank > 0 ? `#${p.rank}` : "—"}</span>
                    <span className="contest-who">
                      <Link href={`/admin?user=${p.userId}`}>
                        <strong>{p.name}</strong>
                      </Link>
                      <span className="muted">{p.email}</span>
                    </span>
                    <span className="contest-score">
                      <strong>{p.score}</strong> validé{p.score > 1 ? "s" : ""}
                      <span className="muted">
                        {" "}
                        / {p.referrals.length} inscrit{p.referrals.length > 1 ? "s" : ""}
                      </span>
                    </span>
                    {p.prize ? (
                      <span className="badge badge-active">{p.prize}</span>
                    ) : !p.eligible && p.score > 0 ? (
                      <span className="badge">
                        Encore {CONTEST.minReferrals - p.score} pour être éligible
                      </span>
                    ) : null}
                  </summary>

                  <div className="table-wrap">
                    <table className="data">
                      <thead>
                        <tr>
                          <th>Filleul</th><th>Inscrit le</th><th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.referrals.map((r) => (
                          <tr key={r.userId}>
                            <td>
                              <Link href={`/admin?user=${r.userId}`}>{r.name}</Link>
                              <div className="muted" style={{ fontSize: "0.8rem" }}>
                                {r.email}
                              </div>
                            </td>
                            <td>{formatDate(r.signedUpAt)}</td>
                            <td>
                              {r.qualifiedAt ? (
                                <>
                                  <span className="badge badge-active">Validé</span>
                                  <div className="muted" style={{ fontSize: "0.8rem" }}>
                                    {r.orderTitle} · payé le {formatDateTime(r.qualifiedAt)}
                                  </div>
                                </>
                              ) : (
                                <span className="badge badge-suspended">
                                  Pas encore de commande de 3 mois ou plus
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {p.reachedAt && (
                    <p className="hint" style={{ marginTop: 8 }}>
                      Score de {p.score} atteint le {formatDateTime(p.reachedAt)} (sert au
                      départage).
                    </p>
                  )}
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
