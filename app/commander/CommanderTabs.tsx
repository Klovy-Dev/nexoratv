"use client";

import { useState } from "react";
import OfferCard, { KIND_FR } from "./OfferCard";
import { groupByKind, groupByDuration, type OfferCardData } from "./offer-groups";

export default function CommanderTabs({
  normalCards,
  packCards,
  loggedIn,
}: {
  normalCards: OfferCardData[];
  packCards: OfferCardData[];
  loggedIn: boolean;
}) {
  const [tab, setTab] = useState<"normal" | "autres">("normal");
  const hasPacks = packCards.length > 0;
  const cards = tab === "autres" && hasPacks ? packCards : normalCards;

  return (
    <>
      {hasPacks && (
        <div className="admin-tabs" style={{ marginBottom: 28 }}>
          <button type="button" className={tab === "normal" ? "active" : ""} onClick={() => setTab("normal")}>
            Formules normales
          </button>
          <button type="button" className={tab === "autres" ? "active" : ""} onClick={() => setTab("autres")}>
            Autres formules
          </button>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="empty-state">
          <p>Aucune offre dans cette catégorie pour le moment.</p>
        </div>
      ) : (
        <OfferGroups cards={cards} loggedIn={loggedIn} />
      )}
    </>
  );
}

function OfferGroups({ cards, loggedIn }: { cards: OfferCardData[]; loggedIn: boolean }) {
  const groups = groupByKind(cards);
  return (
    <>
      {groups.map(([kind, list]) => {
        const durationGroups = groupByDuration(list);
        const showDurationHeads = list.length > 1;
        return (
          <div key={kind} style={{ marginBottom: 44 }}>
            {groups.length > 1 && (
              <h2 style={{ fontSize: "1.4rem", marginBottom: 18 }}>{KIND_FR[kind]}</h2>
            )}
            {durationGroups.map(([duration, durationCards]) => (
              <div key={duration || "_"} style={{ marginBottom: 28 }}>
                {showDurationHeads && duration && (
                  <h3 style={{ fontSize: "1.05rem", marginBottom: 14, color: "var(--text-muted)" }}>
                    {duration}
                  </h3>
                )}
                <div className="offer-grid">
                  {durationCards.map((c) => (
                    <OfferCard
                      key={c.offer.id}
                      offer={c.offer}
                      loggedIn={loggedIn}
                      alreadyPending={c.alreadyPending}
                      trialLocked={c.trialLocked}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
