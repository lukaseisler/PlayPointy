# PlayPointy

Who is more likely to… — party card game as a PWA.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloudflare Pages (playpointy.pages.dev / playpointy.com)

OpenNext baut im **Workers**-Layout (`worker.js` + `assets/`). Cloudflare Pages braucht dagegen `_worker.js` und die statischen Dateien im **Output-Root**, sonst 404 für `/_next/*` und `/cards/*`.

`npm run pages:build` macht beides (OpenNext-Build + Prepare-Schritt).

**Pages Build-Einstellungen** (Dashboard → Project → Settings → Builds):

| Setting | Value |
| --- | --- |
| Build command | `npm run pages:build` |
| Build output directory | `.open-next` |
| Root directory | `/` |

Compatibility flags: `nodejs_compat` (und idealerweise `global_fetch_strictly_public`).

Manuell deployen:

```bash
npm run pages:deploy
```

## Cloudflare Workers (Alternative)

```bash
npm run deploy
```
