import Link from "next/link";
import { loadGoldenottCatalog } from "@/lib/goldenott-catalog";
import {
  CONTEST,
  contestCode,
  contestLeaderboard,
  contestPhase,
  maskName,
  qualifyingPackageIds,
} from "@/lib/contest";
import CopyButton from "@/components/CopyButton";

/** Onglet « Concours » du profil : lien, score perso et top 10 (noms masqués). */
export default async function ContestPanel({
  userId,
  origin,
}: {
  userId: number;
  origin: string;
}) {
  const phase = contestPhase();

  const rules = (
    <div className="empty-state" style={{ textAlign: "left" }}>
      <p>
        <strong>{CONTEST.title}</strong> — du {CONTEST.startLabel} au {CONTEST.endLabel}.
        Partagez votre lien concours : chaque ami qui s&apos;inscrit avec ce lien et
        prend une offre d&apos;au moins 3 mois vous rapporte 1 point. Il faut au
        moins {CONTEST.minReferrals} points pour gagner.
      </p>
      <ol style={{ margin: "10px 0 0 20px" }}>
        {CONTEST.prizes.map((p, i) => (
          <li key={p}>
            <strong>{i + 1}{i === 0 ? "er" : "e"}</strong> : {p}
          </li>
        ))}
      </ol>
      <p style={{ marginTop: 10 }}>
        <Link href="/concours" style={{ color: "var(--text)" }}>
          Lire le règlement complet
        </Link>
      </p>
    </div>
  );

  if (phase === "upcoming") {
    return (
      <>
        {rules}
        <p className="muted" style={{ marginTop: 16 }}>
          Votre lien concours apparaîtra ici le {CONTEST.startLabel}, au lancement
          du concours.
        </p>
      </>
    );
  }

  const participants = await contestLeaderboard(
    qualifyingPackageIds(await loadGoldenottCatalog()),
  );
  const me = participants.find((p) => p.userId === userId);
  const top = participants.filter((p) => p.score > 0).slice(0, 10);
  const link = `${origin}/inscription?concours=${contestCode(userId)}`;
  const pending = me ? me.referrals.length - me.score : 0;

  return (
    <>
      {rules}

      <div className="grid-2" style={{ marginTop: 16 }}>
        {phase === "active" ? (
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Votre lien concours</h3>
            <div className="cred-list">
              <div className="cred-row">
                <span className="k">Lien</span>
                <span className="v" style={{ fontSize: "0.8rem" }}>{link}</span>
                <CopyButton value={link} />
              </div>
            </div>
            <p className="muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
              Différent de votre lien de parrainage : il ne donne pas de crédit, il
              compte pour le concours.
            </p>
          </div>
        ) : (
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Concours terminé</h3>
            <p className="muted">
              Merci à tous les participants ! Les gagnants sont contactés par e-mail.
            </p>
          </div>
        )}

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Votre score</h3>
          <div className="order-recap-price" style={{ padding: 0 }}>
            <strong>
              {me?.score ?? 0} point{(me?.score ?? 0) > 1 ? "s" : ""}
            </strong>
          </div>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 6 }}>
            {me && me.rank > 0 ? `Vous êtes ${me.rank}${me.rank === 1 ? "er" : "e"}. ` : ""}
            {pending > 0
              ? `${pending} ami${pending > 1 ? "s" : ""} inscrit${pending > 1 ? "s" : ""} sans offre de 3 mois ou plus pour l'instant.`
              : ""}
            {me?.prize ? ` En tête pour : ${me.prize}.` : ""}
          </p>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Classement</h3>
        {top.length === 0 ? (
          <p className="muted">Personne n&apos;a encore marqué de point. À vous de jouer !</p>
        ) : (
          <ol className="contest-top">
            {top.map((p) => (
              <li key={p.userId} className={p.userId === userId ? "me" : ""}>
                <span className="contest-rank">#{p.rank}</span>
                <span className="contest-who">
                  {maskName(p.name)}
                  {p.userId === userId ? " (vous)" : ""}
                </span>
                <strong>
                  {p.score} pt{p.score > 1 ? "s" : ""}
                </strong>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
