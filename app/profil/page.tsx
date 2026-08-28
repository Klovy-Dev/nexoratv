import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { subscriptionsForUser } from "@/lib/data";
import { formatDate, initials } from "@/lib/validation";
import CopyButton from "@/components/CopyButton";
import SecretValue from "@/components/SecretValue";
import NameForm from "./NameForm";
import PasswordForm from "./PasswordForm";

export const metadata: Metadata = { title: "Mon profil" };
export const dynamic = "force-dynamic";

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const bienvenue = (await searchParams).bienvenue;
  const subs = await subscriptionsForUser(user.id);

  return (
    <section style={{ paddingTop: 60 }}>
      <div className="container" style={{ maxWidth: 900 }}>
        {bienvenue && (
          <div className="flash flash-success" style={{ marginBottom: 20 }}>
            Bienvenue sur NexoraTV, votre compte a été créé.
          </div>
        )}

        <div className="profile-head reveal">
          <div className="profile-avatar">{initials(user.name)}</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1>{user.name}</h1>
            <div className="meta">
              {user.email} · membre depuis {formatDate(user.created_at)}
            </div>
            <div style={{ marginTop: 8 }}>
              <span
                className={`badge ${user.role === "admin" ? "badge-admin" : ""}`}
              >
                {user.role === "admin" ? "Administrateur" : "Client"}
              </span>
            </div>
          </div>
          {user.role === "admin" && (
            <Link href="/admin" className="btn btn-ghost">
              Espace admin
            </Link>
          )}
        </div>

        <h2 style={{ fontSize: "1.4rem", margin: "36px 0 18px" }}>
          Mes identifiants d&apos;abonnement
        </h2>

        {subs.length === 0 ? (
          <div className="empty-state">
            <p>Aucun abonnement n&apos;est encore associé à votre compte.</p>
            <p style={{ marginTop: 8 }}>
              Après votre paiement, un administrateur ajoute vos identifiants ici.
              Besoin d&apos;aide ?{" "}
              <Link href="/contact" style={{ color: "var(--text)" }}>
                Contactez le support
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            {subs.map((sub) => {
              const [cls, text] =
                sub.status === "suspended"
                  ? ["badge-suspended", "Suspendu"]
                  : sub.expired
                    ? ["badge-expired", "Expiré"]
                    : ["badge-active", "Actif"];
              return (
                <div className="sub-card reveal" key={sub.id}>
                  <div className="sub-card-head">
                    <div>
                      <h3>{sub.label}</h3>
                      <div className="muted" style={{ fontSize: "0.85rem" }}>
                        Expire le {formatDate(sub.expires_at)}
                      </div>
                    </div>
                    <span className={`badge ${cls}`}>{text}</span>
                  </div>

                  <div className="cred-list">
                    <div className="cred-row">
                      <span className="k">Serveur / URL</span>
                      <span className="v">{sub.server_url || "—"}</span>
                      {sub.server_url && <CopyButton value={sub.server_url} />}
                    </div>
                    <div className="cred-row">
                      <span className="k">Utilisateur</span>
                      <span className="v">{sub.username || "—"}</span>
                      {sub.username && <CopyButton value={sub.username} />}
                    </div>
                    <div className="cred-row">
                      <span className="k">Mot de passe</span>
                      <SecretValue value={sub.password} />
                    </div>
                    {sub.note && (
                      <div className="cred-row">
                        <span className="k">Note</span>
                        <span className="v" style={{ fontFamily: "inherit" }}>
                          {sub.note}
                        </span>
                        <span />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              Ces informations sont strictement personnelles. Ne les communiquez à
              personne.
            </p>
          </>
        )}

        <h2 style={{ fontSize: "1.4rem", margin: "44px 0 18px" }}>
          Paramètres du compte
        </h2>

        <div className="grid-2">
          <NameForm currentName={user.name} email={user.email} />
          <PasswordForm />
        </div>
      </div>
    </section>
  );
}
