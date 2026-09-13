import { unlinkDiscordAction } from "@/actions/profile-actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";

export default function DiscordLinkCard({
  discordId,
  status,
}: {
  discordId: string | null;
  status?: "linked" | "conflict" | "error";
}) {
  return (
    <div className="panel">
      <h2 style={{ fontSize: "1.15rem" }}>Compte Discord</h2>

      {status === "conflict" && (
        <div className="flash flash-error" style={{ marginBottom: 16 }}>
          Ce compte Discord est déjà relié à un autre compte NexoraTV.
        </div>
      )}
      {status === "error" && (
        <div className="flash flash-error" style={{ marginBottom: 16 }}>
          La liaison avec Discord a échoué, réessayez.
        </div>
      )}

      {discordId ? (
        <>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Ton rôle sur le serveur Discord NexoraTV (Client actif / Essai 24h)
            est automatiquement synchronisé avec ton abonnement.
          </p>
          <form action={unlinkDiscordAction} style={{ marginTop: 12 }}>
            <ConfirmSubmit
              className="btn btn-ghost btn-sm"
              confirm="Délier ce compte Discord ?"
            >
              Délier mon compte Discord
            </ConfirmSubmit>
          </form>
        </>
      ) : (
        <>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Relie ton compte Discord pour recevoir automatiquement le rôle
            correspondant à ton abonnement sur le serveur NexoraTV.
          </p>
          <a href="/api/discord/oauth" className="btn btn-primary" style={{ marginTop: 12 }}>
            Lier mon compte Discord
          </a>
        </>
      )}
    </div>
  );
}
