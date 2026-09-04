"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { str, isMac, normalizeMac } from "@/lib/validation";
import type { FormState } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Portail MAC — playlists M3U assignées à un appareil                */
/* ------------------------------------------------------------------ */

export async function saveDevicePlaylistAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = Number(formData.get("id")) || null;
  const macRaw = str(formData.get("mac"));
  const name = str(formData.get("name")) || "Playlist";
  const m3uUrl = str(formData.get("m3u_url"));
  const epgUrl = str(formData.get("epg_url"));
  const note = str(formData.get("note"));
  const active = formData.get("active") === "on";

  const errors: string[] = [];
  if (!isMac(macRaw)) {
    errors.push("Adresse MAC invalide (attendu 6 octets, ex. 00:1A:79:AB:CD:EF).");
  }
  const mac = normalizeMac(macRaw);
  if (!/^https?:\/\//i.test(m3uUrl)) {
    errors.push("L'URL M3U doit commencer par http:// ou https://.");
  }
  if (epgUrl && !/^https?:\/\//i.test(epgUrl)) {
    errors.push("L'URL EPG doit commencer par http:// ou https://.");
  }
  if (errors.length > 0) return { fieldErrors: errors };

  const conflict = (await sql`
    SELECT id FROM device_playlists WHERE mac = ${mac} AND id IS DISTINCT FROM ${id}
  `) as unknown as { id: number }[];
  if (conflict.length > 0) {
    return { fieldErrors: ["Cette adresse MAC est déjà assignée à une autre playlist."] };
  }

  if (id) {
    await sql`
      UPDATE device_playlists SET
        mac = ${mac}, name = ${name}, m3u_url = ${m3uUrl},
        epg_url = ${epgUrl || null}, note = ${note}, active = ${active},
        updated_at = now()
      WHERE id = ${id}
    `;
  } else {
    await sql`
      INSERT INTO device_playlists (mac, name, m3u_url, epg_url, note, active)
      VALUES (${mac}, ${name}, ${m3uUrl}, ${epgUrl || null}, ${note}, ${active})
    `;
  }

  revalidatePath("/admin/playlist");
  redirect("/admin/playlist?ok=1");
}

export async function deleteDevicePlaylistAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id")) || 0;
  await sql`DELETE FROM device_playlists WHERE id = ${id}`;
  revalidatePath("/admin/playlist");
  redirect("/admin/playlist?ok=del");
}
