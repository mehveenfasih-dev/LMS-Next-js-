# Production ecosystem and deployment guide

This project uses Next.js App Router, Auth.js, Prisma, and SQL Server. The
integrations below are wired into the application; production still requires
provider credentials, deployment-specific security controls, and monitoring.

## Authentication

The application uses Auth.js with credentials and optional Google sign-in.
Configure the Auth.js secret and, if desired, Google OAuth credentials in
`.env.local` as described in the README. Server-side SQL Server records remain
the authority for account role and active status.

## Forms, validation, state, and UI

- Registration uses React Hook Form in the browser and the shared Zod schema
  in `src/features/auth/schemas.ts`. The Server Action validates the submitted
  `FormData` again before writing to SQL Server. Client validation is for
  usability; the server check is authoritative.
- Use the same pattern for every new mutation: validate untrusted input at the
  server boundary, then authorize and perform the database operation. Never
  trust hidden inputs, client state, role fields, or a value merely because
  the browser already validated it.
- Zustand holds transient client-only UI state (the global request-loading
  counter). React Query owns browser-side server-data caching. Do not copy
  private records or authorization decisions into Zustand or local storage.
- Tailwind CSS v4, Radix Slot, and a shadcn-style Button primitive are
  configured for incremental adoption. Existing screens still use Material
  UI; no mass component migration is implied.

## Environment variables and secrets

`NEXT_PUBLIC_*` values are compiled into browser-visible code and must be
treated as public. Use them only for values safe to disclose, such as a site
URL or Sentry client DSN. Secrets such as `DATABASE_URL`, `AUTH_SECRET`,
`GOOGLE_CLIENT_SECRET`, and `SENTRY_DSN` must remain server-only and be
configured in the deployment platform's secret manager.

`.env.example` contains placeholders, not deployable secrets. `.env.local` is
ignored by Git. Rotate credentials that have ever been exposed; do not paste
production secrets into source control, browser code, logs, or screenshots.

## Server Actions, CSRF, and rate limiting

- Treat every Server Action as a public server endpoint. Re-check the current
  user's identity and role on the server and validate all arguments there.
  Server Actions are not protected just because their references are not
  visible in the UI. Never accept `role`, `userId`, or `isAdmin` from the
  client; re-read the active user from Auth.js + SQL Server
  (`getActiveUserById`).
- Shared helpers live in `src/lib/security/` (`server-only`): Zod
  `parseFormData`, same-origin CSRF for Route Handlers, and sliding-window
  rate limiting. Registration uses `parseFormData` + a 5 / 10-minute IP limit.
- Next.js Server Actions verify the request `Origin` against the host by
  default. Extra exact hosts go in `SERVER_ACTIONS_ALLOWED_ORIGINS` (wired to
  `experimental.serverActions.allowedOrigins` in `next.config.ts`); do not use
  a wildcard. Body size is capped at `1mb`. This origin check is CSRF
  protection, not authorization, input validation, or rate limiting.
- Cookie-authenticated mutating Route Handlers call `guardMutatingRequest`
  (same-origin Origin/Referer vs Host/`x-forwarded-host`, then rate limit)
  before auth and body parsing. Prefer a user-id key after session load for
  sensitive writes. Do not add permissive credentialed CORS.
- Rate limiting uses Upstash Redis when `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` are set. Otherwise an in-process sliding window
  runs (correct for a single Node instance; not sufficient across serverless
  replicas). Failed limits return an explicit `429` with `Retry-After` (or a
  clear Server Action error). Do not silently skip limits.
- SQL writes use Prisma parameterization/transactions. Continue to validate
  identifiers, cap payload sizes, and authorize every mutation server-side.

## Errors and monitoring

`src/app/error.tsx`, `src/app/global-error.tsx`, and `src/app/not-found.tsx`
provide route, root-layout, and not-found fallbacks. Sentry initialization is
wired through Next.js instrumentation and the error boundaries. Set a Sentry
DSN to enable event delivery:

```dotenv
NEXT_PUBLIC_SENTRY_DSN="https://public-key@example.ingest.sentry.io/project-id"
# Optional server-only override:
SENTRY_DSN="https://server-key@example.ingest.sentry.io/project-id"
```

Use a separate Sentry project/environment for staging and production, avoid
collecting personally identifiable information unless a reviewed privacy
policy requires it, and configure alert ownership, retention, and source-map
upload credentials in deployment. The application logs errors if no DSN is
configured; a successful build alone does not mean monitoring is receiving
events.

## Bundle analysis and dynamic imports

Next.js optimizes client bundle sizes through automatic code splitting per route
segment. For client-heavy visualization libraries and non-critical components,
`@next/bundle-analyzer` and `next/dynamic` prevent bloated initial JavaScript:

1. **Bundle analyzer configuration:** `@next/bundle-analyzer` wraps `next.config.ts`
   and is enabled via the `ANALYZE=true` environment variable:
   ```bash
   npm run analyze
   ```
   This generates interactive visual bundle treemaps in `.next/analyze/` showing
   client, server, and edge package sizes.
2. **Dynamic imports with `next/dynamic`:** Heavy client components (such as
   `MonthlyActivityChart` in `src/features/library/components/MonthlyActivityChart.tsx`)
   are imported lazily in `src/app/(dashboard)/reports/page.tsx`:
   ```tsx
   const MonthlyActivityChart = dynamic(
     () =>
       import("@/features/library/components/MonthlyActivityChart").then(
         (m) => m.MonthlyActivityChart,
       ),
     {
       loading: () => <Skeleton height={280} />,
       ssr: true,
     },
   );
   ```
   Setting `ssr: false` is reserved for client-only widgets (e.g. Canvas, WebGL,
   or libraries accessing `window`).

## Metadata API, Open Graph, and Structured Data

Search engine discovery and social card generation use Next.js App Router
file conventions and metadata standards:

- **Root Open Graph Image:** `src/app/opengraph-image.tsx` generates a dynamic
  1200x630 branded banner using `ImageResponse` from `next/og`. In Next.js 16 with
  `cacheComponents` enabled, OG image routes run natively under Node.js without
  deprecated Edge runtime flags.
- **Dynamic Book Open Graph Image:** `src/app/(public)/catalog/[id]/opengraph-image.tsx`
  reads the database record for the specific title via `getServerBook(id)` and
  generates a customized social share card.
- **Dynamic XML Sitemap:** `src/app/sitemap.ts` programmatically queries the catalog
  and produces a compliant sitemap containing both static app routes and all active
  book detail URLs (`/catalog/[id]`).
- **Robots Exclusion:** `src/app/robots.ts` allows public catalog indexing while
  explicitly disallowing authenticated management routes (`/dashboard`, `/books`,
  `/requests`, `/api/`).
- **JSON-LD Structured Data:** `src/lib/metadata/jsonld.ts` renders Schema.org
  `Book` and `WebSite` JSON-LD `<script type="application/ld+json">` tags into
  catalog and book detail server components, facilitating Google Rich Results.

## Analytics: Vercel, Google Analytics, and PostHog

User behavior tracking is consolidated in `src/components/analytics/AnalyticsProvider.tsx`:

- **Vercel Analytics:** Uses `@vercel/analytics/react` for zero-configuration,
  privacy-friendly web vitals and visitor tracking.
- **Google Analytics 4:** Uses `@next/third-parties/google` (`<GoogleAnalytics gaId={GA_ID} />`)
  with automatic script offloading and web worker optimization.
- **PostHog:** Initialized client-side with privacy-conscious defaults (`autocapture: false`,
  `person_profiles: "identified_only"`). A `<PostHogPageViewTracker />` wrapped in
  a `<Suspense>` boundary listens to route transitions via `usePathname` and `useSearchParams`.
- **Event dispatch:** The helper `trackEvent(name, properties)` broadcasts custom
  actions across active providers, while `identifyAnalyticsUser(id, traits)` sets
  authenticated user IDs safely.

## Advanced routing: Parallel routes, intercepting modals, and i18n

1. **Intercepting routes for modals:**
   - Soft navigation to `/catalog/[id]` from within `/catalog` is intercepted by
     `src/app/(public)/catalog/@modal/(.)[id]/page.tsx`, displaying `BookModal`
     over the catalog grid while updating the browser URL.
   - Closing the modal triggers `router.back()`.
   - Direct visits or browser refreshes bypass interception and render the full
     standalone page `src/app/(public)/catalog/[id]/page.tsx`.
   - Parallel route slots require `default.tsx` fallbacks to handle unmatched routes.
2. **Dashboards with independent sections:**
   - Independent dashboard widgets are decomposed into decoupled Server Components.
   - Isolating components prevents slow queries in one section from blocking others.
3. **Internationalization (i18n):**
   - Book Hub combines a client-side `LocaleProvider` for instant UI toggling
     with server-side translation modules in `src/lib/i18n/`.
   - `getServerLocale()` detects preferences via cookies (`library.locale`) and
     `Accept-Language` headers, enabling Server Components to render translated
     text and formatted dates/numbers (`Intl.DateTimeFormat`) before sending HTML.

## Streaming, Suspense, and runtime selection (Edge vs Node.js)

1. **Streaming and Suspense patterns:**
   - In `src/app/(dashboard)/dashboard/page.tsx`, stats metrics (`DashboardStats`)
     and borrowing activity (`DashboardActivity`) are wrapped in separate
     `<Suspense fallback={<Skeleton />}>` boundaries.
   - Fast markup (page shell, navigation, card borders) streams immediately to
     the browser, while slow database queries pipe their completed HTML over the
     open HTTP connection without layout shift.
2. **Runtime selection: Edge vs Node.js in Next.js 16:**

> [!NOTE]
> In Next.js 16, **The Edge Runtime is deprecated** in favor of the unified Node.js
> runtime, and route segment `runtime` overrides are incompatible with
> `nextConfig.cacheComponents` (enabled in this project). The comparison below
> details why Node.js is now the unified standard:

| Dimension            | Legacy Edge Runtime (`runtime = 'edge'`)                          | Node.js Runtime (Default in Next.js 16)                                      |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Status**           | **Deprecated in Next.js 16**; incompatible with `cacheComponents` | **Recommended unified standard** across all routes and components            |
| **Environment**      | Lightweight V8 isolates                                           | Standard Node.js process / container                                         |
| **Cold start**       | Zero to minimal (< 5ms)                                           | Fast (modern serverless starts in 50ms - 150ms)                              |
| **API support**      | Fetch, Web Crypto, Web Streams (strict subset)                    | Full Node standard library (`node:fs`, `node:net`, `node:crypto`)            |
| **Database drivers** | HTTP/REST only (no direct TCP sockets)                            | Full direct TCP sockets, connection pools, Prisma with SQL Server            |
| **Use cases**        | Historical edge middleware & legacy micro-workers                 | All Server Components, Server Actions, Route Handlers, ImageResponse, Prisma |

## Image and file uploads: S3, Cloudinary, and UploadThing

File storage must bypass Next.js application servers to avoid payload limits,
memory spikes, and compute bottlenecks:

1. **AWS S3 presigned PUT URLs (`src/lib/uploads/s3.ts`):**
   - Client requests an upload ticket from `POST /api/uploads`.
   - Next.js authenticates the user, validates MIME type and file size (max 5MB)
     with Zod, and creates a cryptographically signed S3 PUT URL valid for 5 minutes.
   - Browser streams bytes directly to AWS S3.
2. **Cloudinary signed uploads (`src/lib/uploads/cloudinary.ts`):**
   - Server signs upload parameters using SHA-1/SHA-256 with the Cloudinary secret.
   - Client posts directly to Cloudinary; image transformations (`f_auto,q_auto`,
     resizing, format auto-negotiation) run on the CDN.
3. **UploadThing (`src/lib/uploads/uploadthing.ts`):**
   - Type-safe full-stack file router with built-in auth middleware and client hooks.
4. **Security enforcement:**
   - `POST /api/uploads` calls `guardMutatingRequest` (CSRF + rate limiting), validates
     allowed MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/gif`), and
     restricts book cover uploads to administrator accounts.

## Proxy, redirects, and routing

`src/proxy.ts` performs Auth.js role-sensitive redirects. Server layouts and
API handlers also validate the active SQL Server user and role; the proxy is a
fast routing gate, not the final authorization boundary.

Locale and experiment routing can also be added here, but keep routing
decisions deterministic and avoid placing secrets or sensitive user attributes
in URLs. For geo, locale, or A/B routing, define cache variation explicitly:
responses must not be shared across users or variants unless the cache key
includes the relevant dimension. Do not treat a geo header or experiment
cookie as proof of identity or permission.

## Caching: identify each layer

| Layer                          | What lives here                                                                                            | Invalidation                                                                 | Common bug                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **`"use cache"` / data cache** | Catalog list via `getServerBooks()` (`library-books`, hours life). Detail and user-specific data stay out. | `revalidateTag("library-books")` and `revalidatePath` on book/request writes | Stale catalog after an admin edit until tag/path revalidation runs                      |
| **Router Cache**               | Prefetched RSC payloads on client navigation                                                               | Soft navigation, `revalidatePath` / refresh                                  | UI looks old until a hard refresh even though SQL already changed                       |
| **React Query**                | Browser session API data (`staleTime` 30s, `gcTime` 5m)                                                    | Mutation `invalidateQueries`                                                 | Dashboard/request tables lag after approve because only the server path was revalidated |
| **CDN / platform**             | Static assets; must not cache personalized JSON                                                            | Platform rules + `Cache-Control: no-store` on private APIs                   | Shared user-specific response if a CDN caches authenticated JSON                        |

When debugging stale data, determine which layer served it first. Cache
invalidation in one layer does not automatically invalidate the browser query
cache, Router Cache, or a separately configured CDN. Performance and SEO
guidance for Core Web Vitals (LCP, CLS, INP) lives in
[core-web-vitals.md](./core-web-vitals.md).

## Quality and testing

- **Unit and component tests:** Vitest runs in jsdom with React Testing
  Library, jest-dom matchers, and user-event. Tests cover shared registration
  schema normalization/rejection, Button accessibility/behavior, JSON-LD metadata
  generators, and file upload validation.
- **End-to-end tests:** Playwright runs against a local Next.js development
  server using Chromium. The initial smoke test checks the Auth.js login form;
  install the browser once with `npx playwright install chromium`.
- **Linting and formatting:** ESLint uses the Next.js Core Web Vitals and
  TypeScript rules, with Prettier compatibility enabled. Prettier rules and
  ignores are checked in; `format:check` checks files formatted as part of this
  rollout.
- **TypeScript:** `tsconfig.json` enables `"strict": true`; run `npm run typecheck`
  to validate the project.

Run the quality checks:

```bash
npm run test:unit
npm run test:e2e
npm run lint
npm run format:check
npm run typecheck
```

Use `npm run test:unit:watch` during development. The E2E web server uses
`npm run dev`; it may use the configured database if the route under test
requires database-backed rendering.

## Files changed

Authentication uses Auth.js. The Redux files are removed and Zustand stores
the client loading state. Files changed across the ecosystem and advanced features
implementation:

- **Root config & docs:**
  `docs/production-ecosystem.md`, `next.config.ts`, `package.json`, `package-lock.json`.
- **Bundle analysis & Dynamic imports:**
  `next.config.ts` (configured `@next/bundle-analyzer` with `ANALYZE=true`),
  `src/features/library/components/MonthlyActivityChart.tsx` (extracted client visualization),
  `src/app/(dashboard)/reports/page.tsx` (`next/dynamic` import with skeleton fallback).
- **Metadata API & SEO:**
  `src/app/opengraph-image.tsx` (root edge Open Graph image generator),
  `src/app/(public)/catalog/[id]/opengraph-image.tsx` (dynamic book Open Graph generator),
  `src/app/sitemap.ts` (dynamic XML sitemap),
  `src/app/robots.ts` (crawling exclusion and sitemap link),
  `src/lib/metadata/jsonld.ts` (Schema.org JSON-LD generators for Book, WebSite, Breadcrumbs),
  `src/lib/metadata/jsonld.test.ts` (unit tests for structured data),
  `src/app/(public)/catalog/page.tsx` (injected WebSite JSON-LD),
  `src/app/(public)/catalog/[id]/page.tsx` (injected Book JSON-LD).
- **Analytics:**
  `src/components/analytics/AnalyticsProvider.tsx` (Vercel Analytics, Google Analytics 4, PostHog),
  `src/components/providers/AppProviders.tsx` (mounted AnalyticsProvider).
- **Internationalization (i18n):**
  `src/lib/i18n/dictionaries.ts` (dictionaries & supported locales),
  `src/lib/i18n/index.ts` (server-side locale detection via cookies/headers & translation helper),
  `src/components/layout/AuthShell.tsx` (rendered LanguageToggle).
- **Parallel and Intercepting Routes:**
  `src/app/(public)/catalog/layout.tsx` (parallel slot layout),
  `src/app/(public)/catalog/default.tsx` (default fallback),
  `src/app/(public)/catalog/@modal/default.tsx` (modal default slot),
  `src/app/(public)/catalog/@modal/(.)[id]/page.tsx` (intercepted book modal route),
  `src/components/modals/BookModal.tsx` (accessible dialog component with back navigation).
- **Streaming and Suspense:**
  `src/app/(dashboard)/dashboard/page.tsx` (decoupled `DashboardStats` and `DashboardActivity` into concurrent streaming Suspense boundaries with skeletons).
- **Edge Runtime:**
  `src/app/opengraph-image.tsx` (`export const runtime = 'edge'`),
  `src/app/api/edge-health/route.ts` (Edge runtime demonstration endpoint).
- **Image and File Uploads:**
  `src/lib/uploads/types.ts` (Zod schemas for upload requests),
  `src/lib/uploads/s3.ts` (AWS S3 presigned PUT URL generation),
  `src/lib/uploads/cloudinary.ts` (Cloudinary signed parameters & CDN transformations),
  `src/lib/uploads/uploadthing.ts` (UploadThing file router architecture),
  `src/lib/uploads/uploads.test.ts` (unit tests for upload ticket generation & validation),
  `src/app/api/uploads/route.ts` (secured API Route Handler for upload ticket requests).
- **Code hygiene:**
  `src/proxy.ts` (removed unused import).
