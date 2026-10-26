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
  visible in the UI.
- Next.js Server Actions verify the request `Origin` against the host by
  default. If a reverse proxy changes the host, configure only the exact
  trusted origins using Next.js `serverActions.allowedOrigins`; do not use a
  wildcard. This origin check is CSRF protection, not authorization, input
  validation, or rate limiting.
- Cookie-authenticated Route Handlers need their own CSRF policy. Restrict
  writes to same-origin requests (and/or use a CSRF token), configure cookie
  `SameSite`, `Secure`, and `HttpOnly` behavior appropriately, and do not add
  permissive credentialed CORS. Review this policy against the actual proxy
  and domain topology before deployment.
- Registration and other endpoints do not yet have a distributed rate
  limiter. Add one before exposing them publicly, using a shared service such
  as Redis or a managed edge rate-limit product. An in-memory counter is not
  sufficient across serverless instances. Set limits based on observed traffic
  and return an explicit `429`; do not silently skip limits when the service
  fails.
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

1. **Next.js server data cache:** `getServerBooks()` uses a `"use cache"`
   function with an hours cache life and the `library-books` tag. Book
   mutations revalidate that tag and the affected route paths. Detail lookups
   and user-specific/borrowing data are not put in this tagged cache.
2. **Browser query cache:** the React Query client uses a 30-second `staleTime`,
   five-minute `gcTime`, one retry, and no focus refetch. Mutations invalidate
   the matching query keys. This cache is per browser session and is not a
   security boundary.
3. **Next.js Router Cache:** client navigation and prefetching may reuse
   rendered route segments. Revalidate after writes and verify navigation
   behavior for pages that depend on freshly changed data; do not assume a
   database write automatically refreshes an already-open client view.
4. **CDN/deployment cache:** the hosting platform can cache static assets and
   may apply additional rules to routes. Personalized endpoints must remain
   private; the book-list and borrowing-request API responses explicitly use
   `Cache-Control: no-store`. Review platform rules rather than assuming the
   application cache headers override them.

When debugging stale data, determine which layer served it first. Cache
invalidation in one layer does not automatically invalidate the browser query
cache, Router Cache, or a separately configured CDN.

## Quality and testing

- **Unit and component tests:** Vitest runs in jsdom with React Testing
  Library, jest-dom matchers, and user-event. Tests cover shared registration
  schema normalization/rejection and Button accessibility, clicks, and
  disabled behavior.
- **End-to-end tests:** Playwright runs against a local Next.js development
  server using Chromium. The initial smoke test checks the Auth.js login form;
  install the browser once with `npx playwright install chromium`.
- **Linting and formatting:** ESLint uses the Next.js Core Web Vitals and
  TypeScript rules, with Prettier compatibility enabled. Prettier rules and
  ignores are checked in; `format:check` checks files formatted as part of this
  rollout without requiring unrelated legacy files to be reformatted.
- **TypeScript:** `tsconfig.json` already enables `"strict": true`; run the
  dedicated typecheck script to validate the project.

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

Authentication uses Auth.js. The Redux files are removed and Zustand now
stores the client loading state. Files changed across the
ecosystem implementation and this testing follow-up:

- Root config/docs: `.env.example`, `AGENTS.md`, `.prettierrc.json`, `.prettierignore`,
  `README.md`, `docs/production-ecosystem.md`, `eslint.config.mjs`,
  `next.config.ts`, `package.json`, `package-lock.json`,
  `playwright.config.ts`, `postcss.config.mjs`, `vitest.config.ts`,
  `vitest.setup.ts`.
- App errors/styles: `src/app/error.tsx`, `src/app/global-error.tsx`,
  `src/app/globals.css`, `src/app/not-found.tsx`.
- Auth form and providers: `src/components/providers/StateProviders.tsx`,
  `src/features/auth/AuthForm.tsx`, `src/features/auth/actions.ts`,
  `src/features/auth/schemas.ts`.
- UI and application state: `src/components/ui/button.tsx`,
  `src/lib/utils.ts`, `src/store/app-store.ts`.
- Error monitoring: `src/instrumentation-client.ts`,
  `src/instrumentation.ts`, `src/sentry.edge.config.ts`,
  `src/sentry.server.config.ts`.
- Tests: `e2e/auth.spec.ts`, `src/components/ui/button.test.tsx`,
  `src/features/auth/schemas.test.ts`.
- Removed Redux files: `src/store/hooks.ts`, `src/store/store.ts`,
  `src/store/slices/appSlice.ts`.

`src/components/layout/MemberShell.tsx` was already modified before this
follow-up and was left untouched. `AGENTS.md` is generated by the Next.js
development server during the E2E test run.
