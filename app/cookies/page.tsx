import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <LegalShell eyebrow="Traceurs" title="Gestion des cookies">
      <h2>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier déposé sur votre appareil lors de la
        visite d&apos;un site. Il permet notamment de maintenir votre session
        ouverte pendant votre navigation.
      </p>

      <h2>2. Cookies utilisés par NexoraTV</h2>
      <table className="data" style={{ minWidth: "auto", marginTop: 14 }}>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Finalité</th>
            <th>Durée</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>nexoratv_session</code></td>
            <td>Maintien de la session de connexion (jeton signé)</td>
            <td>7 jours</td>
            <td>Strictement nécessaire</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Cookies tiers</h2>
      <p>
        Le site n&apos;utilise pas de cookies publicitaires ni d&apos;outils de
        suivi tiers. Les polices de caractères sont chargées depuis Google Fonts ;
        aucune donnée de profilage n&apos;est transmise par NexoraTV à cette
        occasion.
      </p>

      <h2>4. Votre consentement</h2>
      <p>
        Seuls des cookies strictement nécessaires au fonctionnement du service
        sont déposés. Conformément à la réglementation, ceux-ci ne nécessitent
        pas de consentement préalable.
      </p>

      <h2>5. Comment les gérer ?</h2>
      <p>
        Vous pouvez configurer votre navigateur pour bloquer ou supprimer les
        cookies. Le blocage du cookie de session vous empêchera toutefois de
        rester connecté.
      </p>

      <p style={{ marginTop: 20 }}>
        Voir aussi la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalShell>
  );
}
