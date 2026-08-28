import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function ConditionsPage() {
  return (
    <LegalShell eyebrow="Cadre d'usage" title="Conditions d'utilisation">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent l&apos;accès au site NexoraTV et
        l&apos;utilisation des services associés (création de compte, consultation
        des identifiants d&apos;abonnement, support).
      </p>

      <h2>2. Compte utilisateur</h2>
      <ul>
        <li>Vous devez fournir des informations exactes lors de l&apos;inscription.</li>
        <li>
          Vous êtes responsable de la confidentialité de votre mot de passe et de
          toute activité réalisée depuis votre compte.
        </li>
        <li>
          Un compte est strictement personnel. Le partage des identifiants
          d&apos;abonnement au-delà du cadre autorisé par votre formule est
          interdit.
        </li>
        <li>Prévenez-nous immédiatement en cas d&apos;utilisation non autorisée.</li>
      </ul>

      <h2>3. Utilisation du service</h2>
      <ul>
        <li>
          Vous vous engagez à utiliser le service conformément aux lois
          applicables dans votre pays de résidence.
        </li>
        <li>
          Il est interdit de contourner les mesures de sécurité, de perturber le
          service ou d&apos;y accéder par des moyens automatisés non autorisés.
        </li>
        <li>
          L&apos;éditeur peut suspendre ou résilier un compte en cas de
          manquement aux présentes conditions.
        </li>
      </ul>

      <h2>4. Disponibilité</h2>
      <p>
        L&apos;éditeur met en œuvre des moyens raisonnables pour assurer la
        disponibilité du service mais ne garantit pas un fonctionnement
        ininterrompu. Des opérations de maintenance peuvent entraîner des
        interruptions temporaires.
      </p>

      <h2>5. Responsabilité</h2>
      <p>
        Le service est fourni « en l&apos;état ». Dans les limites permises par la
        loi, l&apos;éditeur ne saurait être tenu responsable des dommages
        indirects résultant de l&apos;utilisation ou de l&apos;impossibilité
        d&apos;utiliser le service.
      </p>

      <h2>6. Résiliation</h2>
      <p>
        Vous pouvez demander la suppression de votre compte à tout moment via la
        page <Link href="/contact">Contact</Link>. La suppression entraîne
        l&apos;effacement de vos données dans les conditions décrites par la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>7. Modification des conditions</h2>
      <p>
        L&apos;éditeur peut modifier les présentes conditions. Les utilisateurs
        sont informés des changements substantiels par un moyen approprié. La
        poursuite de l&apos;utilisation vaut acceptation des conditions mises à
        jour.
      </p>

      <h2>8. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit applicable au siège de
        l&apos;éditeur, sous réserve des dispositions impératives protégeant le
        consommateur.
      </p>
    </LegalShell>
  );
}
