import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ResetForm from "./ResetForm";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ReinitialiserPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  if (await getCurrentUser()) redirect("/profil");

  const { token } = await searchParams;

  if (!token || typeof token !== "string") {
    return (
      <div className="auth-card reveal">
        <h1>Lien invalide</h1>
        <p className="sub">
          Ce lien de réinitialisation est incomplet ou a expiré.
        </p>
        <p className="auth-switch">
          <Link href="/mot-de-passe-oublie">Refaire une demande</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card reveal">
      <h1>Nouveau mot de passe</h1>
      <p className="sub">Choisissez un nouveau mot de passe pour votre compte.</p>
      <ResetForm token={token} />
    </div>
  );
}
