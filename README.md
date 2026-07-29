# PlayPointy

Who is more likely to… — party card game as a PWA.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloudflare deploy

This app uses [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) so Next.js (App Router, `force-dynamic`) runs correctly on Cloudflare Workers/Pages.

**Workers Builds** (GitHub connected) — set:

| Setting | Value |
| --- | --- |
| Build command | `npx @opennextjs/cloudflare build` |
| Deploy command | `npx @opennextjs/cloudflare deploy` |

Do **not** set the build output to `.next` — that causes the classic Cloudflare 404.

Local preview / deploy:

```bash
npm run preview   # build + local Workers runtime
npm run deploy    # build + deploy to Cloudflare
```
