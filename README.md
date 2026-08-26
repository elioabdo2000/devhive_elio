# DevHive — Next.js 16 Capstone (TechTalks Assignment 3)

A full-stack developer community platform: authenticate, publish technical
blogs, join communities, and maintain a public profile.

## Feature overview

- Public: Home, Blogs (ISR), Blog Details, Communities, Community Details, Public Profiles
- Authenticated: create/edit/delete own blogs, join/leave communities, edit profile
- Auth: Google OAuth, GitHub OAuth, **and** email/password via Auth.js v5 (Credentials provider),
  JWT sessions, local `User` document created/updated on sign-in. Passwords are
  hashed with bcrypt and never selected by default queries (`select: false` in
  the schema).
- Backend: all mutations go through Route Handlers (no Server Actions), validated
  with Zod, authorized by session + ownership checks
- Data: MongoDB Atlas + Mongoose (`User`, `Blog`, `Community`, `Membership` models)

## Local installation

```bash
npm install
cp .env.example .env.local   # fill in the values below
npx auth secret               # writes AUTH_SECRET into .env.local automatically,
                               # or generate manually and paste it in
npm run seed                  # populates MongoDB Atlas with sample data
npm run dev
```

Visit http://localhost:3000.

## Environment variables (`.env.local`)

```
MONGODB_URI=              # MongoDB Atlas connection string, include a db name
AUTH_SECRET=               # npx auth secret
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
UPLOADTHING_TOKEN=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Image uploads (UploadThing)

Blog cover images and profile pictures are uploaded from the visitor's
computer, not pasted in as URLs. `POST /api/upload` (session-required,
5MB limit, JPEG/PNG/WebP/GIF only) uploads the file server-side via
UploadThing's `UTApi` and returns a URL, which is what actually gets
stored in `Blog.coverImage` / `User.image` — MongoDB itself never stores
image bytes.

1. Create a free account at uploadthing.com and create an app.
2. From the app's API Keys page, copy the **token** into
   `UPLOADTHING_TOKEN`. This single token replaces the old
   secret-key + app-ID pair from earlier UploadThing versions.
3. No route-level config needed beyond the token — `UTApi` in
   `src/app/api/upload/route.ts` reads it from the environment
   automatically, so it never reaches the browser.

## MongoDB Atlas setup

1. Create a free M0 cluster at mongodb.com/cloud/atlas.
2. Database Access → add a user with a strong password.
3. Network Access → allow `0.0.0.0/0` (fine for coursework; never commit real
   credentials to the repo).
4. Connect → Drivers → copy the connection string into `MONGODB_URI`, adding a
   database name before the `?`, e.g. `.../devhive?retryWrites=true&w=majority`.

## OAuth callback configuration

**Google** (console.cloud.google.com → APIs & Services → Credentials):
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
  (and your deployed URL's equivalent)

**GitHub** (github.com/settings/developers → OAuth Apps → New OAuth App):
- Homepage URL: `http://localhost:3000` (and your deployed URL)
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
  (and your deployed URL's equivalent)
- Copy the generated Client ID into `AUTH_GITHUB_ID`; generate a new client
  secret and copy it into `AUTH_GITHUB_SECRET`
- If a GitHub account's email is private, sign-in will fail (DevHive needs an
  email to create/link the `User` record) — the account must have a public or
  verified primary email accessible under the default `user:email` scope

**Email/password**: no external provider setup needed. `/signup` creates a
`User` with a bcrypt-hashed password via `POST /api/auth/signup`; `/login`
authenticates through Auth.js's Credentials provider, which compares the
submitted password against the stored hash in `src/auth.ts`'s `authorize()`.

Seeded test accounts (created by `npm run seed`) all share one password —
see the console output after seeding, or check `scripts/seed.ts`
(`SEED_PASSWORD`) directly. Log in with any seeded user's email + that
password to test authenticated flows immediately, no OAuth required.

## Rendering strategy

| Page | Strategy | Why |
|---|---|---|
| Home | Server-rendered | Fresh stats + personalized navbar each request |
| Blogs listing | ISR (`revalidate = 120`) | Static-speed delivery, refreshes every 2 min as new posts publish |
| Blog details | ISR (`revalidate = 120`) | Same freshness/performance trade-off as the listing |
| Communities / details | Server-rendered | Member counts and join state must be current |
| Profile | Server-rendered | Authored content and community list fetched fresh |

## Database model summary

- **User** — profile fields + `password` (bcrypt hash, optional) + `providerIds.google` for OAuth identity,
  unique `email`/`username`
- **Blog** — `author` refs `User`, `status` enum (`draft`/`published`), unique `slug`
- **Community** — `createdBy` refs `User`, `members[]` is a denormalized array
  for display/count
- **Membership** — separate join table (`user` + `community`, compound unique
  index) is the source of truth for join/leave, preventing duplicate joins at
  the database layer

## Architecture notes

- `src/lib/db.ts` caches the Mongoose connection on `globalThis` to survive
  Next.js dev-mode hot reloads without opening new connections.
- `proxy.ts` (Next.js 16's renamed `middleware.ts`) redirects unauthenticated
  visitors away from `/blogs/new` and `/profile/edit`, and any signed-in
  non-owner away from `/blogs/[slug]/edit`'s page-level check — but Route
  Handlers independently re-verify session + ownership, since proxy alone
  isn't sufficient for data security.
- Every Route Handler returns `{ success, message, data }` and uses status
  codes 200/201/400/401/403/404/409/500 as appropriate.
- No Server Actions are used anywhere; all client forms call Route Handlers
  with `fetch`.

## Testing checklist

- [ ] Google login, GitHub login, email/password login & signup, logout, session persists on refresh
- [ ] Conditional navbar (Login vs. avatar/Logout)
- [ ] Create / edit / delete a blog as its author; confirm non-owners get 403
- [ ] Join / leave a community; confirm duplicate join returns 409
- [ ] Signed-out "Join" click redirects to `/login`
- [ ] Edit own profile; confirm username-uniqueness validation
- [ ] `/blogs/does-not-exist` and `/communities/does-not-exist` show not-found UI
- [ ] Mobile, tablet, desktop layouts (no horizontal overflow)

## Troubleshooting

**`npm install` fails with `ERESOLVE ... peer next@"^14.0.0-0 || ^15.0.0-0" from next-auth`**
This is a known upstream gap: `next-auth@5.0.0-beta.25`'s peer dependency range doesn't list Next.js 16 yet (open issue: nextauthjs/next-auth#13302). An `.npmrc` with `legacy-peer-deps=true` is included in this repo so plain `npm install` works without needing the flag manually. If you don't have that file for some reason, run `npm install --legacy-peer-deps` instead.

**`'tsx' is not recognized as an internal or external command`**
This means `npm install` didn't finish successfully (usually because of the ERESOLVE error above blocking it). Fix the install first, then `npm run seed` will work — `tsx` is a devDependency and gets its binary installed into `node_modules/.bin` automatically.

**`[auth][error] JWTSessionError: no matching decryption secret`**
Your browser has a session cookie that was encrypted with a different (or missing) `AUTH_SECRET` than what's currently in `.env.local` — usually from testing before `AUTH_SECRET` was set, or after regenerating it. Clear cookies for `localhost:3000` (or open an incognito/private window) and sign in again.

**`[auth][error] CredentialsSignin`**
Either the email/password don't match a user in the database, or the database is empty — this is expected until `npm run seed` has run successfully at least once. Use one of the seeded emails with the password printed at the end of the seed script.

## Deployment

Deploy to Vercel, connect the same MongoDB Atlas cluster, and add all
`.env.local` variables (with production callback URLs registered on both
OAuth apps) as Vercel project environment variables.

**Live demo:** _add your deployed Vercel URL here before submitting_
**Repository:** _add your GitHub repo URL here before submitting_

### Test accounts for evaluators

No sign-up required — after running `npm run seed`, log in with any of the
seeded accounts below. All three share the same password, printed to the
console when the seed script finishes (`SEED_PASSWORD` in `scripts/seed.ts`).

| Email | Notes |
|---|---|
| See seed script output | 3 seeded users, each with authored blogs and community memberships already in place |

Alternatively, use the **Google** or **GitHub** buttons on `/login` — either
provider works and will create a fresh account on first sign-in.
