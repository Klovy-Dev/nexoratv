import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reinitialise?: string }>;
}) {
  if (await getCurrentUser()) redirect("/profil");

  const { next, reinitialise } = await searchParams;

  return (
    <div className="auth-card reveal">
      <h1>Connexion</h1>
      <p className="sub">
        Accédez à votre profil et à vos identifiants d&apos;abonnement.
      </p>
      {reinitialise === "1" && (
        <div className="flash flash-success" style={{ marginBottom: 22 }}>
          Mot de passe mis à jour. Vous pouvez maintenant vous connecter.
        </div>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
