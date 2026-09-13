import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Inscription" };

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await getCurrentUser()) redirect("/profil");
  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref.slice(0, 20) : "";

  return (
    <div className="auth-card reveal">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-full.png" alt="NexoraTV" className="auth-card-logo" width={84} height={84} />
      <h1>Créer un compte</h1>
      <p className="sub">
        Rejoignez NexoraTV et retrouvez vos identifiants d&apos;abonnement au
        même endroit.
      </p>
      {ref && (
        <div className="flash flash-success" style={{ marginBottom: 16 }}>
          Vous avez été invité par un ami — vous êtes au bon endroit.
        </div>
      )}
      <RegisterForm refCode={ref} />
    </div>
  );
}
