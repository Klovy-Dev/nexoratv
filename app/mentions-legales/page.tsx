import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalShell eyebrow="Informations légales" title="Mentions légales">
      <h2>1. Éditeur du site</h2>
      <p>
        Le site <strong>NexoraTV</strong> est édité par :
      </p>
      <ul>
        <li>Raison sociale : [Nom de la société ou de l&apos;exploitant]</li>
        <li>Forme juridique : [SARL / SAS / auto-entrepreneur…]</li>
        <li>Capital social : [le cas échéant]</li>
        <li>Siège social : [Adresse complète]</li>
        <li>Immatriculation : [SIREN / RCS / registre du commerce local]</li>
        <li>Numéro de TVA intracommunautaire : [le cas échéant]</li>
        <li>
          Adresse e-mail :{" "}
          <a href="mailto:contact@nexoratv.example">contact@nexoratv.example</a>
        </li>
        <li>Directeur de la publication : [Nom du responsable]</li>
      </ul>

      <h2>2. Hébergement</h2>
      <p>
        Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave
        #4133, Walnut, CA 91789, États-Unis — <a href="https://vercel.com">vercel.com</a>.
        La base de données est hébergée par le fournisseur PostgreSQL choisi
        (par ex. Neon, <a href="https://neon.tech">neon.tech</a>).
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments du site (structure, textes, logo, charte
        graphique, code source) est protégé par le droit de la propriété
        intellectuelle. Toute reproduction ou représentation, totale ou
        partielle, sans autorisation écrite préalable est interdite.
      </p>
      <p>Le logo NexoraTV est la propriété exclusive de l&apos;éditeur.</p>

      <h2>4. Responsabilité</h2>
      <p>
        L&apos;éditeur s&apos;efforce de fournir des informations exactes et à
        jour. Il ne saurait toutefois être tenu responsable des omissions,
        inexactitudes ou carences dans la mise à jour, qu&apos;elles soient de
        son fait ou du fait des tiers partenaires.
      </p>
      <p>
        L&apos;utilisateur est seul responsable de l&apos;usage qu&apos;il fait
        des contenus et services, ainsi que du respect de la législation
        applicable dans son pays de résidence.
      </p>

      <h2>5. Liens hypertextes</h2>
      <p>
        Le site peut contenir des liens vers des sites tiers sur lesquels
        l&apos;éditeur n&apos;exerce aucun contrôle et décline toute
        responsabilité quant à leur contenu.
      </p>

      <h2>6. Droit applicable</h2>
      <p>
        Les présentes mentions légales sont soumises au droit applicable au
        siège de l&apos;éditeur. Tout litige relève de la compétence des
        tribunaux compétents de ce ressort, sous réserve des dispositions
        légales impératives protégeant le consommateur.
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute question relative au site, utilisez la page{" "}
        <Link href="/contact">Contact</Link>.
      </p>
    </LegalShell>
  );
}
