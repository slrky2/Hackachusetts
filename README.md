# Hackachusetts — City Land

A Next.js community app for Lowell, MA. Application source is in `my-app/`.

## Deploy to Vercel

1. Import `slrky2/Hackachusetts` at https://vercel.com/new.
2. Set **Root Directory** to **`my-app`** and **Framework Preset** to **Next.js**.
3. Use **Node.js 22.x**. The committed `my-app/vercel.json` sets install to `npm ci` and build to `npm run build`. Leave Output Directory at the Next.js default; do not use `out` or static export, because the app needs server APIs and Clerk middleware.
4. Add environment variables from `my-app/.env.local.example` to the appropriate Vercel environments before deploying:
   - **Required:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`, from the same Clerk instance.
   - **Maps:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; optionally `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.
   - **Chatbot:** `ANTHROPIC_API_KEY`. Without it, the assistant responds with an unavailable message (503).
   - **City staff:** optionally `CITY_STAFF_EMAILS` (comma-separated verified emails).
5. Deploy. For a public production release, configure a production instance in Clerk for your deployed domain and enable the desired sign-in methods. Use Clerk development keys for previews. Restrict your Google Maps browser key to the deployed domains and enable Maps JavaScript API and Geocoding API.
6. Check `/`, `/sign-in`, `/map`, and `/chatbot`. Sign in and try posting a report and claiming a bounty. Redeploy after changing `NEXT_PUBLIC_*` values because they are embedded at build time.

Vercel's Git integration handles preview and production deployments. GitHub Actions runs tests and a production build; it does not deploy to GitHub Pages. No Vercel token is needed in GitHub Actions.

## Demo storage

Reports, photos, reactions, bounties, and demo wallets currently live in server memory. They can reset on cold starts or deployments and are not shared between function instances. This deployment is suitable for a demo; it does not provide durable data or real payments. No database setup is required, and setting `DATABASE_URL` alone would not add persistence.

## Local development

```sh
cd my-app
npm ci
cp .env.local.example .env.local
# Fill in the Clerk keys and optional feature keys.
npm run dev
```

Use Node.js 22.x. Run `npm test` and `npm run build` before opening a pull request.
The chatbot's `data/Lowell.md` is explicitly bundled with its Node.js function.

See [the app guide](my-app/README.md) for the source layout.
