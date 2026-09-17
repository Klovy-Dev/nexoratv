import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { DISCORD_INVITE_URL, TELEGRAM_INVITE_URL } from "@/lib/community-links";
import { joinCommunityAction } from "@/actions/auth-actions";
import SubmitButton from "@/components/SubmitButton";

export const metadata: Metadata = { title: "Rejoindre la communauté" };
export const dynamic = "force-dynamic";

export default async function RejoindrePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/profil";

  return (
    <section className="page-hero">
      <div className="container" style={{ maxWidth: 640 }}>
        <span className="eyebrow">Dernière étape</span>
        <h1>Rejoins la communauté NexoraTV</h1>
        <p className="lead" style={{ marginInline: "auto" }}>
          Avant d&apos;accéder à ton espace, rejoins notre Discord ou notre
          Telegram : c&apos;est là que passent les annonces, les mises à jour
          et le support le plus rapide. Choisis celui que tu préfères.
        </p>

        <div className="grid" style={{ marginTop: 30 }}>
          <div className="card">
            <div className="card-icon" aria-hidden="true">
              🎮
            </div>
            <h3>Discord</h3>
            <p>Entraide, annonces de mises à jour, salons dédiés au support.</p>
            <a
              className="btn btn-primary"
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginTop: 16 }}
            >
              Rejoindre le Discord
            </a>
          </div>

          <div className="card">
            <div className="card-icon" aria-hidden="true">
              ✈️
            </div>
            <h3>Telegram</h3>
            <p>Les mêmes annonces et le support, si tu préfères Telegram.</p>
            <a
              className="btn btn-primary"
              href={TELEGRAM_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginTop: 16 }}
            >
              Rejoindre le Telegram
            </a>
          </div>
        </div>

        <form action={joinCommunityAction} style={{ marginTop: 30, textAlign: "center" }}>
          <input type="hidden" name="next" value={next} />
          <SubmitButton pendingLabel="Un instant…">
            J&apos;ai rejoint Discord ou Telegram — continuer
          </SubmitButton>
        </form>
      </div>
    </section>
  );
}
