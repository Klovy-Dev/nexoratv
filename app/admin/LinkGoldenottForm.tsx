import { linkGoldenottSubscriptionAction } from "@/actions/goldenott-actions";
import SubmitButton from "@/components/SubmitButton";

/**
 * Rattache une fiche saisie à la main à l'abonnement GoldenOTT existant,
 * retrouvé par son identifiant de ligne / adresse MAC / code.
 */
export default function LinkGoldenottForm({
  subId,
  userId,
}: {
  subId: number;
  userId: number;
}) {
  return (
    <div className="provider-actions">
      <form action={linkGoldenottSubscriptionAction} className="inline-form">
        <input type="hidden" name="sub_id" value={subId} />
        <input type="hidden" name="user_id" value={userId} />
        <SubmitButton className="btn btn-ghost btn-sm" pendingLabel="Recherche sur GoldenOTT…">
          Lier à GoldenOTT
        </SubmitButton>
      </form>
    </div>
  );
}
