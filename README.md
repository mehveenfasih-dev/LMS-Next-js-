# Book Hub

A library-management application built with Next.js, React, Material UI,
Auth.js, TanStack Query, Prisma ORM, and Microsoft SQL Server.

## Connect the existing SQL Server database

This project maps Prisma models to the tables in `library_lms`; it does not
create a second database. The app uses SQL Server Windows Authentication, so
the Next.js process must run under a Windows account with access to this
database.

Prisma connects over TCP. If TCP/IP is disabled for your SQL Express instance
or SQL Server Browser is unavailable, configure a fixed TCP port in SQL Server
Configuration Manager:

1. Enable **TCP/IP** under **SQL Server Network Configuration → Protocols for
   SQLEXPRESS**.
2. In TCP/IP properties, set **IPAll → TCP Port** to `14331` and clear
   **TCP Dynamic Ports**.
3. Restart the `SQL Server (SQLEXPRESS)` service.

Use SSMS to confirm that the Windows account running this app has access to
`library_lms`. Then add this to the ignored project-root `.env.local` file:

```dotenv
DATABASE_URL="sqlserver://localhost:14331;database=library_lms;integratedSecurity=true;encrypt=true;trustServerCertificate=true"
```

The port can be different if you choose another fixed port; update both SQL
Server and `DATABASE_URL`. `prisma.config.ts` loads `.env.local` for Prisma CLI
commands.

The current `Books` table does not include the publisher, page count, and
description fields used by the app. Run `prisma/sql/setup.sql` once against
`library_lms` in SSMS. It adds those columns with defaults (so existing rows
remain valid) and installs the `Books` audit trigger. The filtered unique ISBN
index and the other existing foreign keys remain SQL Server-managed.

Install/generate the client and initialize roles:

```bash
npm install
npm run db:generate
npm run db:seed
npm run dev
```

The seed creates `admin` and `member` roles. To create an initial admin at the
same time, set `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` (at least 12
characters), and optionally `INITIAL_ADMIN_NAME` in `.env.local` before
running the seed. Otherwise, register a member and promote that account to
`admin` in SSMS.

Do not run `prisma db push` against this hand-created database: use the checked
in setup SQL for the app-specific book fields and trigger. `prisma/schema.prisma`
maps the existing normalized tables. If you change the database schema,
introspect it with `npx prisma db pull` and review the resulting schema before
generating the client.

**Database tools:** SSMS and DBeaver can connect to SQL Server. SQLyog is a
MySQL client and does not manage Microsoft SQL Server.

## Authentication

Auth.js uses signed JWT sessions and stores users, roles, and password hashes
in SQL Server. Passwords are salted and hashed with Node `scrypt`. Google
sign-in is optional; configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
(or the `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` aliases). Add
`http://localhost:3000/api/auth/callback/google` to the OAuth client's
authorized redirect URIs. Google accounts require a verified email and are
created as members. Access-token refresh is performed server-side.

Set `AUTH_SECRET` to a strong random value. Never commit `.env.local` or share
OAuth client secrets.

See [the production ecosystem guide](./docs/production-ecosystem.md)
for secret handling, Server Action validation/CSRF/rate limiting, monitoring,
testing, and the cache-layer matrix. Core Web Vitals (LCP, CLS, INP) and how
to measure them are documented in [docs/core-web-vitals.md](./docs/core-web-vitals.md).

## Data flow and database behavior

- Books, normalized author/category links, physical copies, users, and
  borrowing requests are read and written through Prisma and SQL Server.
- Browser UI state is cached with TanStack Query; library records are not
  duplicated in Redux or browser local storage. Local storage is only used
  for UI preferences such as theme and language.
- Book writes and borrowing status transitions use database transactions.
  Copy counts come from `BookCopies`; approval marks one copy `ON_LOAN`, and
  return marks it `AVAILABLE`.
- A book with any borrowing history cannot be deleted, preserving the
  foreign-key history. The SQL trigger records book inserts, updates, and
  deletes in `BookAudit`.
- Dashboard counts and the reports use SQL-backed counts, joins, grouping,
  and aggregate queries. Category totals use `GROUP BY` / `HAVING`; report
  activity uses a parameterized SQL Server aggregate query.
- API handlers enforce administrator/member access on the server. TanStack
  Query handles client caching and refresh after mutations.

## Project structure

```text
prisma/
  schema.prisma               Prisma models mapped to the existing SQL Server tables
  seed.mjs                    Role and optional initial-admin seed
  sql/setup.sql               Extra book fields and the audit trigger
src/
  app/api/                    Authenticated Prisma-backed API handlers
  features/library/           Library reads, transactional writes, and query hooks
  features/users/repository.ts SQL-backed users and credential verification
  lib/prisma.ts               Shared Prisma Client instance
```

## Checks

```bash
npm run lint
npm run build
```
