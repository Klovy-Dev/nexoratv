import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { listReviews, reviewByUser, reviewStats } from "@/lib/data";
import { formatDate, initials } from "@/lib/validation";
import { deleteReviewAction } from "@/actions/review-actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import ReviewForm from "./ReviewForm";

export const metadata: Metadata = { title: "Avis clients" };
export const dynamic = "force-dynamic";

export default async function AvisPage() {
  const user = await getCurrentUser();
  const [reviews, stats, myReview] = await Promise.all([
    listReviews(),
    reviewStats(),
    user ? reviewByUser(user.id) : Promise.resolve(null),
  ]);

  const rounded = Math.round(stats.average);
  const bars: [string, number][] = [5, 4, 3, 2, 1].map((n) => [
    `${n} ★`,
    stats.count > 0 ? Math.round((stats.distribution[n as 1 | 2 | 3 | 4 | 5] / stats.count) * 100) : 0,
  ]);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Ils utilisent NexoraTV</span>
          <h1>
            Les avis de <span className="gradient-text">notre communauté</span>
          </h1>
          <p className="lead" style={{ marginInline: "auto" }}>
            Retours d&apos;expérience partagés par nos abonnés, directement
            depuis leur compte.
          </p>
        </div>
      </section>

      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="rating-summary reveal">
            <div className="rating-score">
              <div className="num">
                {stats.count > 0 ? stats.average.toFixed(1).replace(".", ",") : "—"}
              </div>
              <div className="stars">
                {"★".repeat(rounded)}
                {"☆".repeat(5 - rounded)}
              </div>
              <div className="count">
                {stats.count > 0 ? `sur ${stats.count} avis` : "Aucun avis pour le moment"}
              </div>
            </div>
            <div className="rating-bars">
              {bars.map(([label, pct]) => (
                <div className="bar-row" key={label}>
                  <span>{label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span>{pct} %</span>
                </div>
              ))}
            </div>
          </div>

          {user ? (
            <ReviewForm existing={myReview} />
          ) : (
            <div className="panel reveal" style={{ marginBottom: 40, textAlign: "center" }}>
              <p className="muted" style={{ marginBottom: 14 }}>
                Connectez-vous pour laisser votre avis.
              </p>
              <Link href="/connexion" className="btn btn-primary">
                Se connecter
              </Link>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="empty-state">
              <p>Aucun avis pour le moment. Soyez le premier à partager le vôtre !</p>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((r) => (
                <article className="review reveal" key={r.id}>
                  <div className="review-head">
                    <div className="avatar">{initials(r.name)}</div>
                    <div>
                      <div className="who">{r.name}</div>
                      <div className="when">{formatDate(r.created_at)}</div>
                    </div>
                  </div>
                  <div className="stars">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </div>
                  <p>{r.body}</p>
                  {user?.id === r.user_id && (
                    <form action={deleteReviewAction} className="inline-form" style={{ marginTop: 12 }}>
                      <ConfirmSubmit className="btn btn-ghost btn-sm" confirm="Supprimer votre avis ?">
                        Supprimer
                      </ConfirmSubmit>
                    </form>
                  )}
                </article>
              ))}
            </div>
          )}

          <div className="cta-band reveal" style={{ marginTop: 56 }}>
            <h2>Envie de vous faire votre propre avis ?</h2>
            <p className="lead">
              Rejoignez la communauté NexoraTV et partagez votre expérience.
            </p>
            <div className="hero-actions">
              <Link href="/inscription" className="btn btn-primary">
                Créer mon compte
              </Link>
              <Link href="/tuto" className="btn btn-ghost">
                Voir le tuto
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
