import "server-only";

/**
 * Notifications "instantanées" vers Discord via de simples webhooks de salon
 * (Discord > salon > Intégrations > Webhooks). Volontairement découplé du
 * bot Discord : ça fonctionne même si le bot est hors ligne, sans dépendre
 * de son polling.
 */

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
}

async function postToWebhook(url: string | undefined, embed: DiscordEmbed): Promise<void> {
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [{ ...embed, timestamp: new Date().toISOString() }] }),
    });
    if (!res.ok) {
      console.error(`[discord-webhook] réponse ${res.status} : ${await res.text().catch(() => "")}`);
    }
  } catch (err) {
    console.error("[discord-webhook] envoi échoué :", err);
  }
}

export function notifyOrderWebhook(embed: DiscordEmbed): Promise<void> {
  return postToWebhook(process.env.DISCORD_ORDER_WEBHOOK_URL, embed);
}

export function notifyReviewWebhook(embed: DiscordEmbed): Promise<void> {
  return postToWebhook(process.env.DISCORD_REVIEW_WEBHOOK_URL, embed);
}
