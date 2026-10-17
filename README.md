# Convex Booking

A self-hostable, single-owner booking app built from the Cal.com UI with a
Convex backend. It includes public scheduling pages, an owner dashboard,
Google Calendar conflict checking, booking confirmations, an admin CLI, and an
MCP endpoint for agents.

**Live example:** [book.teddessert.com](https://book.teddessert.com)

> This is an independent community project. It is not affiliated with or
> supported by Cal.com, Convex, or Cloudflare.

## Why this exists

Most booking products assume a multi-user SaaS and a relational database. This
version is intentionally smaller:

- one owner and any number of public bookers;
- Convex for booking data, availability, and calendar credentials;
- the familiar Cal.com / cal.diy interface;
- a stateless Next.js container that can scale to zero on Cloudflare;
- no Postgres, Redis, or always-on application server.

```text
Browser -> Cloudflare Worker -> Next.js container -> Convex
                                      |
                                      +-> Google Calendar
```

## Self-host on Cloudflare

The supported deployment uses **Convex Cloud** for the backend and
**Cloudflare Workers + Containers** for the web app. Cloudflare Containers
requires Docker during deployment and a Workers Paid plan. A quiet personal
instance scales to zero; the first request after it sleeps may take several
seconds while the container starts.

Start with the complete, copy-pasteable guide:

**[Self-hosting on Cloudflare](docs/SELF_HOSTING.md)**

The short version is:

```bash
git clone https://github.com/modestapproach/convexbooking.git
cd convexbooking
corepack enable
pnpm install

# Create and deploy your Convex project first, then run the guided setup.
cd packages/backend
pnpm exec convex dev --once
pnpm exec convex deploy
cd ../..

pnpm self-host:configure
pnpm self-host:deploy
```

The guided setup writes only ignored local files under `.self-host/`, plus
generated `app/wrangler.jsonc` and `app/.env.self-host`. Secrets are never
written to tracked files. `pnpm self-host:deploy` uploads the Worker secrets
with the code in one Wrangler deployment.

## Repository map

| Path | Purpose |
| --- | --- |
| `packages/backend` | Convex schema, scheduling, booking, calendar OAuth, notifications, MCP |
| `packages/scheduling-engine` | Availability and slot math derived from cal.diy |
| `packages/cli` | Owner/admin CLI over the MCP endpoint |
| `app` | Cal.com / cal.diy-derived Next.js application and Cloudflare Container Worker |
| `scripts/configure.mjs` | Guided generator for the self-host configuration |
| `docs/SELF_HOSTING.md` | End-to-end Cloudflare + Convex deployment guide |
| `deploy` | Optional VPS + Cloudflare Tunnel fallback |

## Local development

Backend tests and type checks use pnpm:

```bash
pnpm install
pnpm test
pnpm backend:typecheck
```

The web application retains the upstream Yarn workspace:

```bash
cd app
corepack yarn install
corepack yarn dev
```

See [`app/AGENTS.md`](app/AGENTS.md) before changing the Cal.com-derived
application.

## Security model

- Public booking routes are intentionally unauthenticated.
- The owner dashboard is protected by Cloudflare Access and a signed,
  HTTP-only application cookie.
- Long-lived Google refresh tokens are encrypted before being stored in
  Convex.
- Cloudflare and Convex secrets stay in provider secret stores; generated
  local secret files are gitignored.
- The included admin MCP requires scoped bearer keys (`admin:read` or
  `admin:write`).

Please report vulnerabilities privately as described in
[`SECURITY.md`](SECURITY.md).

## License and attribution

Convex Booking is released under the [MIT License](LICENSE). Significant parts
of `app/` and the scheduling engine are derived from Cal.com / cal.diy and
remain under their MIT terms. Copyright and provenance details are in
[`NOTICE.md`](NOTICE.md); third-party license files already present in the
source tree must be preserved.

## Project status

This is production software for a single-owner deployment, not a drop-in
replacement for every Cal.com feature. The Convex-backed paths are the
supported surface. Contributions that improve portability, setup, security,
or documentation are welcome.
