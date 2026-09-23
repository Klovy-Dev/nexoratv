"use client";

import { useState } from "react";
import OfferCard, { KIND_FR } from "./OfferCard";
import { groupByKind, groupByDuration, type OfferCardData } from "./offer-groups";

type Tab = "normal" | "autres";

export default function CommanderTabs({
  normalCards,
  packCards,
  loggedIn,
}: {
  normalCards: OfferCardData[];
  packCards: OfferCardData[];
  loggedIn: boolean;
}) {
  const [tab, setTab] = useState<Tab>("normal");
  const hasPacks = packCards.length > 0;
  const cards = tab === "autres" && hasPacks ? packCards : normalCards;
  const maxPackScreens = Math.max(0, ...packCards.map((c) => c.offer.included_screens));

  const tabs: { id: Tab; label: string; hint: string }[] = [
    { id: "normal", label: "Formules normales", hint: "1 écran" },
    {
      id: "autres",
      label: "Autres formules",
      hint: maxPackScreens > 1 ? `Packs jusqu'à ${maxPackScreens} écrans` : "Packs multi-écrans",
    },
  ];

  return (
    <>
      {hasPacks && (
        <div className="plan-switch" role="tablist" aria-label="Type de formule">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              <strong>{t.label}</strong>
              <small>{t.hint}</small>
            </button>
          ))}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="empty-state">
          <p>Aucune offre dans cette catégorie pour le moment.</p>
        </div>
      ) : (
        // key : repart de la durée par défaut à chaque changement d'onglet
        <OfferGroups key={tab} cards={cards} loggedIn={loggedIn} />
      )}
    </>
  );
}

function OfferGroups({ cards, loggedIn }: { cards: OfferCardData[]; loggedIn: boolean }) {
  const groups = groupByKind(cards);
  return (
    <>
      {groups.map(([kind, list]) => (
        <div key={kind} className="plan-section">
          {groups.length > 1 && <h2 className="plan-kind-title">{KIND_FR[kind]}</h2>}
          <KindOffers cards={list} loggedIn={loggedIn} />
        </div>
      ))}
    </>
  );
}

/**
 * Si plusieurs formules partagent une même durée (packs Confort / Premium /
 * Famille en 12, 24, 36 mois), on affiche un sélecteur de durée et seulement
 * les cartes de la durée choisie. Sinon (une offre par durée), toutes les
 * cartes tiennent dans une seule grille triée par prix.
 */
function KindOffers({ cards, loggedIn }: { cards: OfferCardData[]; loggedIn: boolean }) {
  const durationGroups = groupByDuration(cards);
  const useSwitcher =
    durationGroups.length > 1 && durationGroups.some(([, list]) => list.length > 1);

  const defaultDuration =
    durationGroups.find(([, list]) => list.some((c) => c.offer.badge))?.[0] ??
    durationGroups[0]?.[0] ??
    "";
  const [duration, setDuration] = useState(defaultDuration);

  const visible = useSwitcher
    ? (durationGroups.find(([d]) => d === duration)?.[1] ?? durationGroups[0][1])
    : durationGroups.flatMap(([, list]) => list);

  return (
    <>
      {useSwitcher && (
        <div className="plan-durations" role="group" aria-label="Durée d'abonnement">
          {durationGroups.map(([d]) => (
            <button
              key={d || "_"}
              type="button"
              aria-pressed={d === duration}
              onClick={() => setDuration(d)}
            >
              {d || "Autre"}
            </button>
          ))}
        </div>
      )}
      <div className="plan-grid">
        {visible.map((c) => (
          <OfferCard
            key={c.offer.id}
            offer={c.offer}
            loggedIn={loggedIn}
            alreadyPending={c.alreadyPending}
            trialLocked={c.trialLocked}
          />
        ))}
      </div>
    </>
  );
}
