import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <LegalShell eyebrow="Vos données" title="Politique de confidentialité">
      <p>
        Cette politique explique quelles données personnelles NexoraTV collecte,
        pourquoi, et quels sont vos droits.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est l&apos;éditeur du site indiqué dans les{" "}
        <Link href="/mentions-legales">mentions légales</Link>.
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>
          <strong>Compte</strong> : nom, adresse e-mail, mot de passe (stocké
          sous forme de hachage bcrypt, jamais en clair).
        </li>
        <li>
          <strong>Abonnement</strong> : identifiants techniques associés à votre
          compte (URL de serveur, nom d&apos;utilisateur, mot de passe
          d&apos;abonnement). Le mot de passe d&apos;abonnement est chiffré au
          repos (AES-256-GCM).
        </li>
        <li>
          <strong>Connexion</strong> : adresse IP et horodatage des tentatives de
          connexion, à des fins de sécurité (limitation des attaques par force
          brute).
        </li>
        <li>
          <strong>Support</strong> : contenu des messages adressés via le
          formulaire de contact.
        </li>
      </ul>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li>Création et gestion du compte — exécution du contrat.</li>
        <li>Fourniture des identifiants d&apos;abonnement — exécution du contrat.</li>
        <li>Sécurité du service et prévention de la fraude — intérêt légitime.</li>
        <li>Réponse aux demandes de support — intérêt légitime.</li>
        <li>Obligations légales et comptables — obligation légale.</li>
      </ul>

      <h2>4. Durée de conservation</h2>
      <ul>
        <li>Données de compte : durée de vie du compte, puis suppression sous 12 mois.</li>
        <li>Journaux de connexion : 12 mois maximum.</li>
        <li>Messages de support : 24 mois maximum.</li>
      </ul>

      <h2>5. Destinataires</h2>
      <p>
        Vos données sont traitées par l&apos;éditeur et ses sous-traitants
        techniques (hébergement Vercel, base de données PostgreSQL). Elles ne
        sont ni vendues ni louées à des tiers.
      </p>

      <h2>6. Sécurité</h2>
      <p>
        Hachage des mots de passe (bcrypt), chiffrement authentifié des
        identifiants d&apos;abonnement (AES-256-GCM), sessions signées et
        cookies <code>HttpOnly</code>/<code>SameSite</code>, limitation des
        tentatives de connexion, requêtes SQL paramétrées, en-têtes de sécurité
        HTTP et Content-Security-Policy.
      </p>

      <h2>7. Vos droits</h2>
      <p>
        Conformément à la réglementation applicable (dont le RGPD si vous résidez
        dans l&apos;UE), vous disposez d&apos;un droit d&apos;accès, de
        rectification, d&apos;effacement, de limitation, d&apos;opposition et de
        portabilité. Pour les exercer, écrivez-nous via la page{" "}
        <Link href="/contact">Contact</Link>. Vous pouvez aussi saisir votre
        autorité de protection des données.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Voir la page <Link href="/cookies">Cookies</Link>.
      </p>
    </LegalShell>
  );
}
