import Link from "next/link";
import type { Metadata } from "next";
import Callout from "@/components/Callout";
import {
  getLatestAppRelease,
  formatSize,
  RELEASES_URL,
  type AppAsset,
} from "@/lib/app-release";

export const metadata: Metadata = {
  title: "Installer l'application",
  description:
    "Téléchargez l'application NexoraTV pour Windows (installeur) et Android (APK).",
};

// Régénère la page toutes les 30 min (nouvelle version = lien à jour).
export const revalidate = 1800;

function DownloadButton({
  asset,
  label,
  variant = "primary",
}: {
  asset: AppAsset | null;
  label: string;
  variant?: "primary" | "ghost";
}) {
  if (!asset) {
    return (
      <a
        href={RELEASES_URL}
        className={`btn btn-${variant === "primary" ? "primary" : "ghost"}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label}
      </a>
    );
  }
  return (
    <a
      href={asset.url}
      className={`btn btn-${variant === "primary" ? "primary" : "ghost"}`}
    >
      {label}
      <span style={{ opacity: 0.7, fontWeight: 500 }}>
        {" "}
        · {formatSize(asset.size)}
      </span>
    </a>
  );
}

export default async function TelechargerPage() {
  const release = await getLatestAppRelease();
  const version = release?.version;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Application NexoraTV</span>
          <h1>
            Installer sur <span className="gradient-text">Windows &amp; Android</span>
          </h1>
          <p className="lead" style={{ marginInline: "auto" }}>
            Notre application maison : TV, films et séries, lecteur intégré,
            reprise de lecture et mises à jour automatiques.
            {version && (
              <>
                {" "}
                <strong>Version&nbsp;{version}</strong>.
              </>
            )}
          </p>
        </div>
      </section>

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="grid">
            {/* -------- Windows -------- */}
            <div className="card reveal">
              <div className="card-icon">🪟</div>
              <h3>Windows 10 / 11</h3>
              <p>
                Installeur classique, sans droits administrateur. Crée un
                raccourci « NexoraTV » dans le menu Démarrer.
              </p>
              <div
                className="stack"
                style={{ marginTop: 18, justifyItems: "start" }}
              >
                <DownloadButton
                  asset={release?.windowsInstaller ?? null}
                  label="Télécharger l'installeur"
                />
                <DownloadButton
                  asset={release?.windowsPortable ?? null}
                  label="Version portable (.zip)"
                  variant="ghost"
                />
              </div>
            </div>

            {/* -------- Android -------- */}
            <div className="card reveal">
              <div className="card-icon">🤖</div>
              <h3>Android (téléphone, box, TV)</h3>
              <p>
                Fichier APK à installer directement. Compatible Android&nbsp;7 et
                plus, y compris les box Android et Android&nbsp;TV.
              </p>
              <div
                className="stack"
                style={{ marginTop: 18, justifyItems: "start" }}
              >
                <DownloadButton
                  asset={release?.androidApk ?? null}
                  label="Télécharger l'APK"
                />
                <a href="/tuto/applications" className="btn btn-ghost">
                  Autres applications
                </a>
              </div>
            </div>
          </div>

          {!release && (
            <Callout type="warning">
              Impossible de récupérer la dernière version pour le moment.
              Retrouvez tous les fichiers sur la{" "}
              <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
                page des versions
              </a>
              .
            </Callout>
          )}

          <div className="panel reveal" style={{ marginTop: 32 }}>
            <h2>Installation pas à pas</h2>

            <h4 style={{ marginTop: 8, marginBottom: 8 }}>Windows</h4>
            <ol className="order-steps">
              <li className="done">
                Téléchargez et ouvrez <strong>NexoraTV-Setup</strong>.
              </li>
              <li className="done">
                Si Windows affiche « Windows a protégé votre ordinateur »,
                cliquez sur <strong>Informations complémentaires</strong> puis{" "}
                <strong>Exécuter quand même</strong> (l&apos;app n&apos;est pas
                encore signée par un certificat payant).
              </li>
              <li className="done">
                Laissez l&apos;installation se terminer, puis lancez{" "}
                <strong>NexoraTV</strong>.
              </li>
              <li className="done">
                Ajoutez votre abonnement en mode <strong>Xtream Codes</strong>{" "}
                (URL, identifiant, mot de passe depuis votre profil).
              </li>
            </ol>

            <h4 style={{ marginTop: 20, marginBottom: 8 }}>Android</h4>
            <ol className="order-steps">
              <li className="done">Téléchargez le fichier APK.</li>
              <li className="done">
                À l&apos;ouverture, autorisez{" "}
                <strong>« Installer des applications inconnues »</strong> pour
                votre navigateur ou gestionnaire de fichiers.
              </li>
              <li className="done">
                Validez l&apos;installation, ouvrez <strong>NexoraTV</strong>.
              </li>
              <li className="done">
                Connectez-vous en <strong>Xtream Codes</strong> avec vos
                identifiants.
              </li>
            </ol>

            <Callout type="info">
              Les mises à jour suivantes sont proposées automatiquement dans
              l&apos;application — pas besoin de revenir ici.
            </Callout>
          </div>

          <div className="cta-band reveal" style={{ marginTop: 48 }}>
            <h2>Pas encore abonné ?</h2>
            <p className="lead">
              Créez votre compte et choisissez votre formule en quelques minutes.
            </p>
            <div className="hero-actions">
              <Link href="/commander" className="btn btn-primary">
                Voir les offres
              </Link>
              <Link href="/tuto" className="btn btn-ghost">
                Consulter le tuto
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
