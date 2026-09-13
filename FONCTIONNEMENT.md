# Fonctionnement de NexoraTV (site nexoratv-vercel)

Documentation de référence sur le fonctionnement du site. Écrite pour se
repérer rapidement dans le code, pas pour remplacer sa lecture.

## 1. Vue d'ensemble

- **Stack** : Next.js (App Router, Server Actions), TypeScript, PostgreSQL
  (via `postgres.js`), déployé sur Vercel.
- **Rôle du site** : vitrine + espace client (self-service) pour un service
  IPTV revendu via le panel **GoldenOTT**. Le client s'inscrit, commande une
  formule, paie par carte (Stripe), et son abonnement est provisionné
  automatiquement.
- Il n'y a pas d'app séparée pour l'admin : `/admin` fait partie du même
  projet Next.js, protégé par rôle.

## 2. Structure des dossiers

```
app/            pages (App Router) : publiques, /profil, /admin, /api
actions/        Server Actions ("use server") : toute la logique métier
                appelée depuis les formulaires
lib/            code serveur réutilisable : accès DB, auth, mails,
                intégration GoldenOTT, Stripe, validation
components/     composants React partagés (boutons, formulaires...)
```

Règle générale du repo : les pages (`app/`) restent fines et lisent les
données via `lib/data.ts` ; les mutations passent par `actions/*.ts` ; les
intégrations externes (GoldenOTT, Stripe, e-mail) sont isolées dans `lib/`.

## 3. Base de données

Une seule base Postgres. Le schéma est créé et migré **automatiquement** au
démarrage (`lib/db.ts`, fonction `ensureSchema`) — pas de migrations à jouer
à la main. Un numéro de version (`SCHEMA_VERSION`) évite de rejouer les
`ALTER TABLE` à chaque requête une fois la base à jour.

Tables principales :

| Table | Rôle |
|---|---|
| `users` | comptes (client/admin), + code et solde de parrainage |
| `subscriptions` | abonnements IPTV actifs, rattachés à un `user` |
| `iptv_offers` | formules vendables sur `/commander` (prix, durée, écrans...) |
| `iptv_orders` | commandes en cours (statuts ci-dessous) |
| `reviews` | avis clients affichés sur le site |
| `device_playlists` | playlists M3U assignées par adresse MAC (portail app) |
| `tuto_sections` | contenu éditable de la page `/tuto` |
| `goldenott_events` | journal d'audit des appels au panel GoldenOTT |
| `referral_rewards` | historique des récompenses de parrainage accordées |
| `password_resets`, `login_attempts`, `stripe_webhook_events` | technique |

## 4. Authentification

- `lib/auth.ts` : sessions par cookie JWT (`nexoratv_session`, 7 jours),
  signé avec `AUTH_SECRET`. Le jeton porte l'identité complète (nom, e-mail,
  rôle) pour éviter une requête DB à chaque page ; `requireAdmin` revérifie
  quand même le rôle en base (un compte rétrogradé perd l'accès aussitôt).
- `middleware.ts` protège `/profil` et `/admin` (redirection vers
  `/connexion` si non connecté) et gère le **mode maintenance** (§10).
- Mots de passe : `bcryptjs`. Réinitialisation par lien à durée de vie
  limitée (`password_resets`), anti-énumération (réponse identique que le
  compte existe ou non).

## 5. Parcours client

### Inscription (`/inscription`)
`actions/auth-actions.ts::registerAction`. Un lien `/inscription?ref=CODE`
pré-remplit le parrainage (voir §7).

### Commande (`/commander` → `/commander/[id]`)
1. Le client choisit une offre (`iptv_offers`), le nombre d'écrans si
   l'offre le permet, coche d'éventuelles options (adulte, contenu FR).
2. `createOrderAction` (`actions/order-actions.ts`) crée une ligne
   `iptv_orders` en statut **`awaiting_payment`**, déduit un éventuel crédit
   de parrainage disponible, puis ouvre une session **Stripe Checkout** pour
   le montant restant.
3. Le renouvellement d'un abonnement existant suit le même principe
   (`createRenewalOrderAction`).

### Paiement (Stripe)
- Webhook `POST /api/stripe/webhook`, événement `checkout.session.completed`.
  Vérifie la signature (`STRIPE_WEBHOOK_SECRET`), déduplique (table
  `stripe_webhook_events`), marque la commande payée (`paid_at`,
  `stripe_payment_intent_id`), puis appelle `fulfillPaidOrder`.

### Activation automatique
`lib/order-fulfillment.ts::fulfillPaidOrder` :
- **Nouvel abonnement** → `provisionSubscription` (GoldenOTT) crée la ligne
  / le MAG / le code, l'enregistre dans `subscriptions`, envoie l'e-mail de
  confirmation, et déclenche une éventuelle récompense de parrainage (§7).
- **Renouvellement** → `extendSubscriptionLocal` prolonge l'abonnement
  existant côté GoldenOTT.
- En cas d'échec technique (panel injoignable, crédit revendeur épuisé...),
  la commande repasse en statut **`pending`** : le paiement est déjà
  confirmé, rien n'est perdu, un admin termine à la main depuis
  `/admin/commandes` (`approveOrderAction`).

### Statuts d'une commande (`iptv_orders.status`)
`awaiting_payment` → `pending` (payée) → `fulfilled` (activée) ; ou
`rejected` (refusée + remboursement Stripe auto) / `cancelled` (annulée par
le client avant paiement).

### Espace client (`/profil`)
Onglets : **Mes abonnements** (identifiants, échéance), **Mes commandes**
(suivi + reprise de paiement), **Parrainage** (§7), **Paramètres du compte**.

## 6. Intégration GoldenOTT (panel revendeur)

- `lib/goldenott.ts` : client HTTP brut de l'API revendeur
  (`GOLDENOTT_API_KEY`, jamais exposée côté client — module `server-only`).
  Trois types d'abonnement : `line` (M3U), `mag` (boîtier MAC), `code`
  (code d'activation).
- `lib/goldenott-provision.ts` : couche métier entre les Server Actions et
  ce client — création, prolongation, remboursement, synchronisation —
  chaque opération est journalisée dans `goldenott_events`.
- **Synchronisation planifiée** : cron Vercel quotidien (3h,
  `vercel.json` → `/api/cron/goldenott-sync`) qui reprend le statut réel de
  chaque abonnement GoldenOTT (jusqu'à 200 par exécution, les plus anciens
  d'abord) et purge les commandes/essais expirés.

## 7. Parrainage (ajouté 2026-09)

- Chaque compte a un **code de parrainage** unique (`users.referral_code`,
  généré à l'inscription) et un **solde de crédit** (`referral_balance_cents`).
- Un lien `/inscription?ref=CODE` enregistre `users.referred_by` sur le
  nouveau compte.
- Dès que ce filleul voit sa **toute première commande payée** activée
  (jamais sur un essai gratuit ni un renouvellement), le parrain reçoit
  5 € de crédit (`grantReferralReward`, `lib/data.ts` — constante
  `REFERRAL_REWARD_CENTS`). Une seule récompense par filleul (contrainte
  unique en base).
- Le crédit est appliqué **automatiquement** à la commande suivante du
  parrain (réservé à la création de la commande, restitué si elle est
  annulée / refusée / abandonnée). Au moins 1 € reste toujours à régler par
  carte (`REFERRAL_MIN_PAYABLE_CENTS`).
- Visible côté client dans `/profil` → onglet **Parrainage** (code, lien à
  copier, solde, historique).

## 8. Espace admin (`/admin`, rôle `admin` uniquement)

- `/admin` : tableau de bord (nombre de clients, abonnements actifs,
  commandes en attente).
- `/admin/commandes` : validation manuelle des commandes payées non encore
  activées automatiquement, refus + remboursement Stripe.
- `/admin/offres` : gestion des formules vendables (`iptv_offers`).
- `/admin/playlist` : playlists M3U par adresse MAC (portail app, §9).
- `/admin/tuto` : contenu éditable de la page publique `/tuto`.

## 9. Portail MAC / application NexoraTV

- `GET /api/playlist?mac=...` : l'application boîtier (Fire TV / Android
  TV / box) interroge cette route avec son adresse MAC pour récupérer sa
  playlist M3U — l'URL M3U réelle n'est jamais exposée côté client.
  L'adresse MAC fait office de secret, comme un portail MAG classique.
- `lib/app-release.ts` : source de vérité des versions d'application =
  le manifeste `update.json` du dépôt `Klovy-Dev/nexoratv-app` (un bloc par
  plateforme : `win-v*`, `android-v*`, `ios-v*`). Sert les liens de
  téléchargement (`/telecharger`, `/apk`) et le code Downloader pour le
  sideload sur boîtier.

## 10. Mode maintenance

- Contrôlé par la variable d'environnement `MAINTENANCE_MODE` (`"true"` =
  actif), lue par `middleware.ts`.
- Actif : tout le site est réécrit vers `/maintenance`, **sauf** pour les
  comptes admin connectés et une liste d'exceptions techniques
  (`/connexion`, `/api`, `/apk`, les binaires de l'app) pour ne pas casser
  les boîtiers déjà installés chez les clients.
- Changer cette variable sur Vercel nécessite un redéploiement pour
  prendre effet en production (les Server/Edge Functions embarquent les
  variables au déploiement).

## 11. E-mails

`lib/mail.ts` (envoi via Resend, `RESEND_API_KEY`) + gabarits dans
`lib/order-mail.ts` / `lib/email-layout.ts` : confirmation de commande
acceptée, alerte de provisioning échoué (à l'équipe), refus de commande,
réinitialisation de mot de passe.

## 12. Variables d'environnement (rôle, pas valeur)

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | connexion PostgreSQL |
| `AUTH_SECRET` | signature des sessions JWT |
| `ENCRYPTION_KEY` | chiffrement des mots de passe d'abonnement stockés |
| `GOLDENOTT_API_KEY` / `GOLDENOTT_API_URL` | panel revendeur IPTV |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | paiement carte |
| `RESEND_API_KEY` / `MAIL_FROM` | envoi d'e-mails |
| `CRON_SECRET` | protège la route de synchronisation planifiée |
| `MAINTENANCE_MODE` | active/désactive le mode maintenance |
| `ORDER_NOTIFY_EMAIL` | (optionnel) adresse alertée des nouvelles commandes |

Voir `.env.example` pour la liste complète et les commentaires associés.

## 13. Déploiement

- Hébergé sur Vercel (projet `syrendevs-projects/nexoratv`), déploiement à
  chaque push sur la branche liée. Le cron de synchronisation GoldenOTT est
  déclaré dans `vercel.json`.
- Le schéma DB se met à jour tout seul au premier appel après déploiement
  (`ensureSchema`) — aucune commande de migration à lancer manuellement.
