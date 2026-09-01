# NexoraTV — application Next.js (déploiement Vercel)

Site vitrine + espace membre, réécrit avec **Next.js 15** (App Router, Server
Actions) et **PostgreSQL**. Conçu pour tourner sur **Vercel** avec une base
**Neon** (offre gratuite).

> La version PHP historique reste dans le dossier `NexoraTV/` (elle n'est pas
> compatible Vercel).

---

## 1. Prérequis

- **Node.js 18.18+** (ou 20+) — <https://nodejs.org>
- Un compte **Vercel** — <https://vercel.com>
- Une base **PostgreSQL** gratuite — le plus simple : **Neon** (<https://neon.tech>),
  ou l'intégration « Postgres » depuis le tableau de bord Vercel.

---

## 2. Configuration

Trois variables d'environnement sont nécessaires (plus deux facultatives) :

| Variable         | Rôle                                                              |
|------------------|------------------------------------------------------------------|
| `DATABASE_URL`   | Chaîne de connexion PostgreSQL (utilisez la version « pooled »). |
| `AUTH_SECRET`    | Secret de signature des sessions (JWT).                          |
| `ENCRYPTION_KEY` | Clé AES-256 (64 caractères hexadécimaux) pour chiffrer les identifiants d'abonnement. |
| `RESEND_API_KEY` | *(facultatif)* clé API [Resend](https://resend.com) pour l'e-mail de réinitialisation de mot de passe. Sans elle, le lien est écrit dans les logs. |
| `MAIL_FROM`      | *(facultatif)* expéditeur des e-mails, ex. `NexoraTV <no-reply@votre-domaine.fr>`. |
| `APP_URL`        | *(facultatif)* URL publique du site, pour les liens dans les e-mails. |
| `GOLDENOTT_API_KEY` | *(facultatif)* token du compte revendeur [GoldenOTT](https://goldenott.net/api/documentation). Active le provisioning automatique des abonnements (voir §10). Sans elle, seule la saisie manuelle d'identifiants est disponible. |
| `GOLDENOTT_API_URL` | *(facultatif)* base de l'API GoldenOTT. Défaut : `https://goldenott.net/api`. |
| `CRON_SECRET`    | *(facultatif)* secret partagé pour la route de synchronisation planifiée `/api/cron/goldenott-sync`. |

Le fichier `.env.local` fourni contient déjà un `AUTH_SECRET` et un
`ENCRYPTION_KEY` générés. **Il ne reste qu'à renseigner `DATABASE_URL`.**

Pour régénérer les secrets :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"   # AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"         # ENCRYPTION_KEY
```

---

## 3. Développement local

```bash
npm install
# renseignez DATABASE_URL dans .env.local
npm run dev
```

Ouvrez <http://localhost:3000>. Le schéma de base de données est créé
automatiquement au premier chargement d'une page. Aucun compte administrateur
n'est créé automatiquement — voir « Devenir administrateur » ci-dessous.

---

## 4. Déploiement sur Vercel

### Étape 1 — pousser le code sur GitHub

```bash
git init
git add .
git commit -m "NexoraTV — Next.js"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/nexoratv.git
git push -u origin main
```

### Étape 2 — importer dans Vercel

1. <https://vercel.com/new> → sélectionnez le dépôt.
2. Framework détecté : **Next.js** (rien à changer).
3. Avant de déployer, ajoutez les variables d'environnement
   (**Settings → Environment Variables**) : `DATABASE_URL`, `AUTH_SECRET`,
   `ENCRYPTION_KEY`.
4. **Deploy**.

### Étape 3 — devenir administrateur

Aucun compte admin n'est créé automatiquement (par sécurité). Pour promouvoir
un compte :

1. Créez un compte normal via `/inscription`.
2. Ouvrez la base de données (Neon → **SQL Editor**, ou tout client
   PostgreSQL) et exécutez :
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'votre@e-mail.fr';
   ```
3. Reconnectez-vous : `/admin` est maintenant accessible depuis le menu de
   compte.

> 💡 Base de données : dans Vercel, l'onglet **Storage → Create Database →
> Postgres (Neon)** crée la base et injecte `DATABASE_URL` automatiquement dans
> le projet.

---

## 5. Pages

| Page | Route | Accès |
|------|-------|-------|
| Accueil | `/` | public |
| Avis | `/avis` | public |
| Tuto | `/tuto` | public |
| Contact | `/contact` | public |
| Connexion | `/connexion` | public |
| Inscription | `/inscription` | public |
| Mot de passe oublié | `/mot-de-passe-oublie` | public |
| Réinitialisation | `/reinitialiser-mot-de-passe` | public (lien e-mail) |
| Mon profil | `/profil` | connecté |
| Administration | `/admin` | admin |
| Mentions légales | `/mentions-legales` | public |
| Confidentialité | `/confidentialite` | public |
| Conditions d'utilisation | `/conditions` | public |
| Cookies | `/cookies` | public |
| 404 | toute URL inconnue | — |

---

## 6. Espace membre

1. Le client **s'inscrit** (`/inscription`).
2. L'**administrateur** ouvre `/admin`, choisit le client, et **ajoute ses
   identifiants d'abonnement** (libellé, URL du serveur, utilisateur, mot de
   passe, date d'expiration, statut, note).
3. Le client retrouve ces identifiants sur **`/profil`**, avec boutons
   *Afficher* / *Copier*. Le statut (actif / suspendu / expiré) est affiché.

Un client peut avoir plusieurs abonnements. Le premier compte créé devient
automatiquement administrateur s'il n'en existe aucun.

---

## 7. Sécurité

- Mots de passe utilisateurs **hachés** (bcrypt, coût 12).
- Mots de passe d'abonnement **chiffrés au repos** (AES-256-GCM).
- Sessions = **JWT signé** (HS256) dans un cookie `HttpOnly` + `SameSite=Lax`
  + `Secure` en production.
- **Server Actions** : protection CSRF intégrée (vérification d'origine par Next).
- **Anti brute-force** : 5 tentatives / 15 min par e-mail + IP.
- Requêtes **paramétrées** (aucune concaténation SQL).
- Échappement automatique par React (pas de `dangerouslySetInnerHTML`).
- **En-têtes de sécurité** + **Content-Security-Policy** (`next.config.mjs`).
- `middleware.ts` bloque l'accès à `/profil` et `/admin` sans session valide.
- Champ **honeypot** anti-bot sur l'inscription et le contact.

---

## 8. À faire avant la « vraie » mise en production

1. Changer le mot de passe admin (voir §4, étape 3).
2. Compléter les pages légales (champs `[entre crochets]`).
3. Configurer [Resend](https://resend.com) (`RESEND_API_KEY`, `MAIL_FROM`,
   domaine vérifié) : la réinitialisation de mot de passe passe par `lib/mail.ts`.
   Sans clé, le lien de réinitialisation est écrit dans les logs.
   Le formulaire de contact (`actions/contact-actions.ts`) reste à brancher
   sur le même helper.
4. Vérifier que `DATABASE_URL` pointe bien vers la connexion **pooled**.
5. Sauvegardes de la base (Neon propose des snapshots automatiques).

---

## 9. Intégration GoldenOTT (provisioning automatique)

L'API revendeur GoldenOTT permet de **créer, prolonger, rembourser et
synchroniser** les abonnements IPTV directement depuis NexoraTV, au lieu de
les saisir à la main dans le panel.

### Activation

1. Générer un token API depuis le tableau de bord GoldenOTT (compte revendeur).
2. Le renseigner dans `GOLDENOTT_API_KEY` (`.env.local` **et** Vercel →
   Settings → Environment Variables).
3. C'est tout : un onglet **GoldenOTT** apparaît dans le formulaire d'ajout
   d'abonnement, et les menus **Commandes** / **Offres** s'activent dans l'admin.

La clé ne quitte jamais le serveur (`lib/goldenott.ts` est `server-only`).
Chaque appel sensible est tracé dans la table `goldenott_events`
(visible en bas de `/admin`).

### Les trois types d'abonnement

| Type | Identifiant client | Route API |
|------|--------------------|-----------|
| **Ligne M3U** (`line`) | utilisateur + mot de passe | `/v1/lines` |
| **Boîtier MAG** (`mag`) | adresse MAC | `/v1/mags` |
| **Code d'activation** (`code`) | code à saisir dans l'appli | `/v1/active-codes` |

### Provisioning par l'admin

`/admin` → un client → **Ajouter un abonnement** → onglet **GoldenOTT** :
choix du forfait (chargé en direct depuis l'API, avec son coût en crédits),
template de bouquets optionnel, identifiants générés automatiquement si laissés
vides. À la validation, l'abonnement est créé sur GoldenOTT **et** enregistré
localement (identifiants chiffrés) puis rattaché au client.

Sur chaque abonnement GoldenOTT : **↻ Sync** (rafraîchit statut + expiration),
**Prolonger** (choix d'un forfait → `extend`), **Rembourser** (crédite le compte
revendeur, `mass_refund` optionnel).

### Self-service client

- **`/admin/offres`** : l'admin emballe un forfait GoldenOTT sous un nom
  commercial + un prix en euros (table `iptv_offers`). Pour les lignes M3U, on
  peut autoriser le client à **choisir son nombre d'écrans** (1 → 5) avec un
  supplément par écran (défaut +3 €) ; le prix se met à jour en direct sur
  `/commander` et le total est figé dans la commande.
- **`/commander`** : le client choisit une offre → une **commande** est créée
  (`iptv_orders`, statut `pending`). *Le paiement s'insère ici plus tard.*
- **`/admin/commandes`** : l'admin **valide** → provisioning GoldenOTT →
  abonnement rattaché, commande `fulfilled`. Ou **refuse** avec un motif.
- **E-mails automatiques** (`lib/order-mail.ts`, via Resend) : à la commande
  → confirmation au client + notification à l'équipe (`ORDER_NOTIFY_EMAIL`
  ou l'e-mail du 1er admin) ; à la validation → « abonnement actif » au
  client ; au refus → e-mail avec le motif. Nécessite `RESEND_API_KEY` +
  `MAIL_FROM` sur un domaine vérifié.
- Sur `/profil`, le client peut demander le **renouvellement** d'un abonnement
  existant (→ commande de type renouvellement → l'admin valide → `extend`).

### Synchronisation planifiée

`vercel.json` déclare un **Cron Job Vercel** sur `/api/cron/goldenott-sync`
(protégé par `CRON_SECRET`). Il met à jour l'expiration et le statut de tous
les abonnements GoldenOTT (200 max par passage, les plus anciennement
synchronisés d'abord).

- **Plan Hobby** : la fréquence est limitée à **une fois par jour** — d'où le
  `0 3 * * *` (03:00 UTC). Le cron ne s'exécute que sur le déploiement
  **Production**.
- **Plan Pro** : tu peux passer à `0 */6 * * *` (toutes les 6 h) ou plus.

Vercel envoie automatiquement l'en-tête `Authorization: Bearer $CRON_SECRET`
si la variable `CRON_SECRET` existe dans le projet. Appel manuel :

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/goldenott-sync
```

Mise en place :

```bash
# 1. déclarer le secret côté Vercel (Production)
echo "<valeur-de-CRON_SECRET>" | vercel env add CRON_SECRET production
# 2. déployer — le cron apparaît alors dans Vercel → Project → Cron Jobs
git push        # (déclenche le déploiement)
```

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `lib/goldenott.ts` | client HTTP de l'API (auth, parsing, erreurs typées) |
| `lib/goldenott-catalog.ts` | chargement mutualisé profil + forfaits + templates |
| `lib/goldenott-provision.ts` | logique métier : créer / prolonger / rembourser / synchroniser + journal |
| `actions/goldenott-actions.ts` | Server Actions admin |
| `actions/offer-actions.ts` / `order-actions.ts` | offres et commandes |
| `app/api/cron/goldenott-sync/route.ts` | synchronisation planifiée |

---

## 10. Structure

```
nexoratv-vercel/
├── app/
│   ├── layout.tsx  globals.css  page.tsx  not-found.tsx  manifest.ts
│   ├── icon.png  apple-icon.png  favicon.ico
│   ├── avis/  tuto/  contact/  connexion/  inscription/
│   ├── profil/           (page + NameForm + PasswordForm + RenewButton)
│   ├── commander/        (page + OrderForm — self-service client)
│   ├── admin/            (page + SubscriptionForm + ProviderActions)
│   │   ├── offres/       (catalogue d'offres vendables)
│   │   └── commandes/    (validation des commandes clients)
│   ├── api/cron/goldenott-sync/   (synchronisation planifiée)
│   └── mentions-legales/  confidentialite/  conditions/  cookies/
├── actions/
│   ├── auth-actions.ts       (inscription, connexion, déconnexion)
│   ├── profile-actions.ts    (nom, mot de passe)
│   ├── admin-actions.ts      (abonnements manuels, rôles, suppression)
│   ├── goldenott-actions.ts  (provision / extend / refund / sync)
│   ├── offer-actions.ts      (CRUD des offres)
│   ├── order-actions.ts      (commandes clients + validation admin)
│   └── contact-actions.ts
├── components/   (NavBar, SiteHeader/Footer, Faq, CopyButton, SecretValue…)
├── lib/
│   ├── db.ts          (PostgreSQL + création du schéma + admin initial)
│   ├── auth.ts        (sessions JWT, rôles, hash bcrypt)
│   ├── crypto.ts      (AES-256-GCM + identifiants aléatoires)
│   ├── data.ts        (requêtes abonnements / utilisateurs / offres / commandes)
│   ├── goldenott.ts           (client API GoldenOTT, server-only)
│   ├── goldenott-catalog.ts   (profil + forfaits + templates, mutualisé)
│   ├── goldenott-provision.ts (logique métier + journal d'audit)
│   ├── validation.ts  types.ts
├── middleware.ts      (protection des routes /profil et /admin)
├── next.config.mjs    (en-têtes de sécurité + CSP)
└── .env.local / .env.example
```
