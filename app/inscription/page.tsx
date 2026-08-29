import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Inscription" };

export default async function InscriptionPage() {
  if (await getCurrentUser()) redirect("/profil");

  return (
    <div className="auth-card reveal">
      <h1>Créer un compte</h1>
      <p className="sub">
        Rejoignez NexoraTV et retrouvez vos identifiants d&apos;abonnement au
        même endroit.
      </p>
      <RegisterForm />
    </div>
  );
}
