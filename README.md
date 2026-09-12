# Ledger — Cash, Agenda & Org manager

A small web app for a team of up to ~20 people to track:
- **Cash** — income/expense ledger with running balance
- **Agenda** — upcoming and past events/meetings
- **Organization** — member directory and shared task list

Built with React + Vite, Firebase (Auth + Firestore) for data, and deployed
free on GitHub Pages via GitHub Actions.

---

## 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it (e.g. `org-ledger`) → finish setup (Analytics optional).
2. In the project, click the **web** icon (`</>`) to register a new web app. Name it anything. Copy the `firebaseConfig` values shown — you'll need them in step 3.
3. In the left menu, go to **Build → Authentication → Get started**. Enable the **Email/Password** sign-in method.
4. Go to **Build → Firestore Database → Create database**. Start in **production mode**, pick a region close to your team.
5. Once created, go to the **Rules** tab and paste the contents of `firestore.rules` from this project, then **Publish**.

### Add your ~20 users
Still in **Authentication → Users**, click **Add user** for each person (email + a temporary password they should change on first login). There's no public sign-up page in this app on purpose — only accounts you create can log in.

---

## 2. Configure the project locally

```bash
npm install
cp .env.example .env.local
```

Open `.env.local` and paste in the values from your Firebase `firebaseConfig` (step 1.2):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Run it locally:

```bash
npm run dev
```

Visit `http://localhost:5173`, sign in with one of the users you created.

---

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/org-manager.git
git push -u origin main
```

> If you name your repo something other than `org-manager`, update the `base` value in `vite.config.js` to match: `/your-repo-name/`.

---

## 4. Add your Firebase config as GitHub Secrets

The build running on GitHub Actions doesn't have your `.env.local` file (it's gitignored on purpose), so give it the same values as repo secrets:

In your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**. Add each of these, using the same values from your `.env.local`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

---

## 5. Turn on GitHub Pages

In your repo → **Settings → Pages** → under **Build and deployment**, set **Source** to **GitHub Actions**.

Push again (or re-run the workflow from the **Actions** tab) — the included workflow (`.github/workflows/deploy.yml`) builds the app and deploys it automatically on every push to `main`.

Your app will be live at:
```
https://YOUR_USERNAME.github.io/org-manager/
```

---

## How data is organized in Firestore

Three top-level collections, created automatically the first time each is used:

| Collection | Fields |
|---|---|
| `transactions` | `description`, `amount` (+income / −expense), `category`, `date`, `createdBy`, `createdAt` |
| `events` | `title`, `date`, `time`, `location`, `notes`, `createdBy`, `createdAt` |
| `members` | `name`, `role`, `email`, `status` |
| `tasks` | `title`, `owner`, `done`, `createdAt` |

You can browse/edit this data directly anytime in **Firebase Console → Firestore Database**.

## Notes on access for ~20 users

- Every signed-in user currently has full read/write access to all data (simplest setup for a small trusted team). If you later want role-based permissions (e.g. only a treasurer can edit Cash), that's a change to `firestore.rules` plus a `role` check.
- The free tiers of Firebase (Spark plan) and GitHub Pages comfortably cover a team this size.

## Local development commands

```bash
npm run dev       # local dev server
npm run build      # production build to /dist
npm run preview    # preview the production build locally
```
