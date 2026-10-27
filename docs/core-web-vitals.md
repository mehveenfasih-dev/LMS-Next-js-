# Core Web Vitals

Book Hub reports field metrics with `WebVitalsReporter` (`onLCP`, `onCLS`,
`onINP`). In development they print to the console; when
`NEXT_PUBLIC_SENTRY_DSN` is set they are also recorded as Sentry breadcrumbs
and measurements.

## Metrics

| Metric | What it measures | Good (approx.) | What usually helps here |
| --- | --- | --- | --- |
| **LCP** (Largest Contentful Paint) | When the main visible content finishes painting | ≤ 2.5 s | Optimize catalog/cover images, keep fonts on `display: swap`, avoid blocking the hero/catalog render |
| **CLS** (Cumulative Layout Shift) | Visual stability while loading | ≤ 0.1 | Reserve space for book covers and banners; do not inject late UI above existing content |
| **INP** (Interaction to Next Paint) | Responsiveness to clicks/key presses | ≤ 200 ms | Keep borrow/approve handlers light; avoid long synchronous work on the main thread |

FID is obsolete for field scoring; use **INP**.

## How to measure

1. **In-app (field):** open the app with the browser console and watch `[CWV]`
   logs, or inspect Sentry breadcrumbs/measurements after deploying a DSN.
2. **Chrome DevTools:** Performance panel or Lighthouse (lab estimate; useful
   for regressions, not a substitute for real-user data).
3. **PageSpeed Insights / CrUX:** paste a public URL for lab + field (Chrome
   User Experience Report) data when the site is reachable.
4. **Local Lighthouse CLI:** `npx lighthouse http://localhost:3000 --only-categories=performance` while `npm run start` is running a production build.

## Performance and SEO notes

- Prefer Server Components and streamed HTML for catalog/content so crawlers
  and LCP see meaningful markup without waiting on client waterfalls.
- Keep `metadata` / Open Graph configured in the root layout (already present).
- Personalized JSON APIs use `Cache-Control: no-store`; do not put private
  member data in CDN-cacheable HTML. See the caching matrix in
  [production-ecosystem.md](./production-ecosystem.md).
