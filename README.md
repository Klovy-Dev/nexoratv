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
| `ADMIN_EMAIL`    | *(facultatif)* e-mail du compte admin initial. Défaut : `admin@nexoratv.local`. |
| `ADMIN_PASSWORD` | *(facultatif)* mot de passe du compte admin initial. Défaut : `ChangeMoi!2026`. |

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

Ouvrez <http://localhost:3000>. Le schéma de base de données et le compte
administrateur sont créés automatiquement au premier chargement d'une page.

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
   `ENCRYPTION_KEY`, et éventuellement `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
4. **Deploy**.

### Étape 3 — première connexion

Rendez-vous sur `https://votre-projet.vercel.app/connexion` et connectez-vous
avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`. **Changez immédiatement le mot de passe**
depuis *Mon profil*.

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
3. Brancher un envoi d'e-mail réel pour le formulaire de contact
   (`actions/contact-actions.ts` — actuellement écrit dans les logs).
   Recommandé : [Resend](https://resend.com).
4. Vérifier que `DATABASE_URL` pointe bien vers la connexion **pooled**.
5. Sauvegardes de la base (Neon propose des snapshots automatiques).

---

## 9. Structure

```
nexoratv-vercel/
├── app/
│   ├── layout.tsx  globals.css  page.tsx  not-found.tsx  manifest.ts
│   ├── icon.png  apple-icon.png  favicon.ico
│   ├── avis/  tuto/  contact/  connexion/  inscription/
│   ├── profil/           (page + NameForm + PasswordForm)
│   ├── admin/            (page + SubscriptionForm + ConfirmSubmit)
│   └── mentions-legales/  confidentialite/  conditions/  cookies/
├── actions/
│   ├── auth-actions.ts       (inscription, connexion, déconnexion)
│   ├── profile-actions.ts    (nom, mot de passe)
│   ├── admin-actions.ts      (abonnements, rôles, suppression)
│   └── contact-actions.ts
├── components/   (NavBar, SiteHeader/Footer, Faq, CopyButton, SecretValue…)
├── lib/
│   ├── db.ts          (PostgreSQL + création du schéma + admin initial)
│   ├── auth.ts        (sessions JWT, rôles, hash bcrypt)
│   ├── crypto.ts      (AES-256-GCM)
│   ├── data.ts        (requêtes abonnements / utilisateurs)
│   ├── validation.ts  types.ts
├── middleware.ts      (protection des routes /profil et /admin)
├── next.config.mjs    (en-têtes de sécurité + CSP)
└── .env.local / .env.example
```
