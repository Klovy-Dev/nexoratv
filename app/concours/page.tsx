import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/LegalShell";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CONTEST, contestPhase } from "@/lib/contest";

export const metadata: Metadata = { title: "Règlement du concours" };
export const dynamic = "force-dynamic";

export default async function ConcoursPage() {
  // Invisible avant le lancement, sauf pour l'admin (aperçu).
  if (contestPhase() === "upcoming" && (await getCurrentUser())?.role !== "admin") {
    notFound();
  }

  return (
    <LegalShell eyebrow="Concours" title={`Règlement — ${CONTEST.title}`}>
      <h2>1. Organisateur</h2>
      <p>
        Le concours est organisé par NexoraTV, éditeur du site nexoratv.fr. Il est
        gratuit : aucun achat n&apos;est demandé au participant lui-même.
      </p>

      <h2>2. Durée</h2>
      <p>
        Du {CONTEST.startLabel} (00 h 00) au {CONTEST.endLabel}, heure de Paris.
      </p>

      <h2>3. Participation</h2>
      <p>
        Tout titulaire d&apos;un compte client NexoraTV peut participer. Pendant le
        concours, un lien personnel apparaît dans l&apos;onglet « Concours » de son{" "}
        <Link href="/profil?onglet=concours">profil</Link>. Ce lien est distinct du
        lien de parrainage et ne donne droit à aucun crédit.
      </p>

      <h2>4. Comment gagner des points</h2>
      <p>Le participant gagne 1 point par personne (« filleul ») qui, pendant le concours :</p>
      <ul>
        <li>crée un nouveau compte NexoraTV via son lien concours ;</li>
        <li>
          et paie une première offre d&apos;une durée d&apos;au moins 3 mois
          (les essais gratuits et les renouvellements ne comptent pas).
        </li>
      </ul>
      <p>
        Un abonnement remboursé ou annulé ne rapporte pas de point. Chaque
        filleul ne compte qu&apos;une fois.
      </p>

      <h2>5. Classement et départage</h2>
      <p>
        Les participants sont classés par nombre de points. En cas d&apos;égalité,
        celui qui a atteint son score en premier (date de paiement de la commande
        qui lui a donné son dernier point) passe devant. Pour gagner, il faut
        totaliser au moins {CONTEST.minReferrals} points.
      </p>

      <h2>6. Lots</h2>
      <ol>
        {CONTEST.prizes.map((p, i) => (
          <li key={p}>
            {i + 1}
            {i === 0 ? "er" : "e"} : {p}
          </li>
        ))}
      </ol>
      <p>
        Les lots sont ajoutés au compte du gagnant (nouvel abonnement ou
        prolongation). Ils ne sont ni échangeables, ni remboursables, ni
        convertibles en argent. Si moins de trois participants atteignent{" "}
        {CONTEST.minReferrals} points, les lots restants ne sont pas attribués.
      </p>

      <h2>7. Annonce des gagnants</h2>
      <p>
        Les gagnants sont contactés par e-mail dans les 7 jours suivant la fin du
        concours, et le classement final reste visible dans l&apos;onglet
        « Concours » du profil (prénoms et initiales uniquement).
      </p>

      <h2>8. Fraude</h2>
      <p>
        Sont exclus : les comptes créés par le participant lui-même, les comptes
        multiples ou fictifs, les commandes remboursées ou contestées, et toute
        tentative de contourner ces règles. NexoraTV se réserve le droit de
        disqualifier un participant en cas de doute sérieux, et de modifier ou
        d&apos;annuler le concours en cas de force majeure ; les participants en
        seront alors informés.
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Les données utilisées (nom, adresse e-mail, commandes) servent uniquement
        à établir le classement et à contacter les gagnants. Voir la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalShell>
  );
}
