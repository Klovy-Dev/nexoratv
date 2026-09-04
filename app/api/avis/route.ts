import { NextResponse } from "next/server";
import { listReviews, reviewStats } from "@/lib/data";

/**
 * Avis clients au format JSON, consommé par l'application NexoraTV
 * (écran d'accueil). Réponse mise en cache 5 min côté edge.
 *
 *   GET /api/avis
 *   {
 *     "count": 12,
 *     "average": 4.9,
 *     "reviews": [
 *       { "author": "Sofia", "rating": 5, "date": "2026-08-30", "text": "…" }
 *     ]
 *   }
 */
export const revalidate = 300;

function isoDay(value: unknown): string {
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toISOString().slice(0, 10);
}

export async function GET(): Promise<Response> {
  try {
    const [reviews, stats] = await Promise.all([listReviews(), reviewStats()]);
    return NextResponse.json(
      {
        count: stats.count,
        average: Number(stats.average.toFixed(2)),
        reviews: reviews.slice(0, 50).map((r) => ({
          author: r.name,
          rating: r.rating,
          date: isoDay(r.created_at),
          text: r.body,
        })),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch {
    // Base indisponible : réponse vide plutôt qu'une 500 (l'app dégrade
    // proprement en masquant la section avis).
    return NextResponse.json({ count: 0, average: 0, reviews: [] });
  }
}
