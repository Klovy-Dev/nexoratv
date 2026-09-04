import { NextResponse } from "next/server";
import { devicePlaylistByMac } from "@/lib/data";
import { isMac, normalizeMac } from "@/lib/validation";

/**
 * Portail MAC pour l'application NexoraTV.
 *
 *   GET /api/playlist?mac=00:1A:79:AB:CD:EF
 *   200 { "name": "...", "m3uUrl": "...", "epgUrl": "..." | null }
 *   404 { "error": "not_found" }   — MAC inconnu ou désactivé
 *   400 { "error": "invalid_mac" }
 *
 * Le MAC fait office de secret (comme un portail MAG classique) : pas
 * d'authentification supplémentaire. Pas de cache — la réponse doit refléter
 * les changements admin immédiatement.
 */
export async function GET(req: Request): Promise<Response> {
  const macRaw = new URL(req.url).searchParams.get("mac") ?? "";
  if (!isMac(macRaw)) {
    return NextResponse.json({ error: "invalid_mac" }, { status: 400 });
  }
  const mac = normalizeMac(macRaw);

  const playlist = await devicePlaylistByMac(mac);
  if (!playlist) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      name: playlist.name,
      m3uUrl: playlist.m3u_url,
      epgUrl: playlist.epg_url,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
