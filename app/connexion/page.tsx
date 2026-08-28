import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage() {
  if (await getCurrentUser()) redirect("/profil");

  return (
    <div className="auth-wrap">
      <div className="container">
        <div className="auth-card reveal">
          <h1>Connexion</h1>
          <p className="sub">
            Accédez à votre profil et à vos identifiants d&apos;abonnement.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
