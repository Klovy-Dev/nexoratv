import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ForgotForm from "./ForgotForm";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default async function MotDePasseOubliePage() {
  if (await getCurrentUser()) redirect("/profil");

  return (
    <div className="auth-card reveal">
      <h1>Mot de passe oublié</h1>
      <p className="sub">
        Indiquez l&apos;adresse e-mail de votre compte : nous vous enverrons un
        lien pour choisir un nouveau mot de passe.
      </p>
      <ForgotForm />
    </div>
  );
}
