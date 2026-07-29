# PlayPointy

Who is more likely to… — party card game as a PWA.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloudflare Pages

### Why not “Build with Git” alone?

OpenNext workers need **Wrangler ≥ 4.33**. Cloudflare Pages Git builds still compile `_worker.js` with **Wrangler 3.114.17**, which produces a broken worker → **Internal Server Error** on `/`.

Use Direct Upload via GitHub Actions (this repo) or locally:

```bash
npm run pages:deploy
```

### One-time Cloudflare setup

1. Pages project name: `playpointy`
2. **Disable automatic Git deployments** (Settings → Builds), otherwise Pages re-publishes the broken Git build.
3. Add GitHub secrets:
   - `CLOUDFLARE_API_TOKEN` (Pages Edit)
   - `CLOUDFLARE_ACCOUNT_ID`
4. Push to `main` → workflow **Deploy Cloudflare Pages** runs.

### Compatibility flags (`wrangler.jsonc`)

Already set for Server Components / Node APIs:

- `nodejs_compat`
- `nodejs_compat_populate_process_env`
- `global_fetch_strictly_public`

Also enable the same flags under Pages → Settings → Functions if the dashboard offers them.

### Build output

`npm run pages:build` runs OpenNext, then remaps the output for Pages (`_worker.js`, assets at root, `_routes.json`).

## Cloudflare Workers (alternative)

```bash
npm run deploy
```

Workers Builds: build `npx @opennextjs/cloudflare build`, deploy `npx @opennextjs/cloudflare deploy`.
