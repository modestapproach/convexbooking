# Self-host Convex Booking on Cloudflare

This guide deploys the supported production architecture:

```text
your domain -> Cloudflare Worker -> Cloudflare Container -> Convex Cloud
                                                        -> Google Calendar
```

The web container is stateless. Bookings, availability, event types, and
encrypted calendar credentials live in your own Convex project.

## What you need

- Node.js 22, Corepack, and pnpm 10
- Docker running locally
- a Convex account
- a Cloudflare account with your domain as an active zone
- the Cloudflare Workers Paid plan (Containers are not on the free plan)
- a Google Cloud project if you want calendar conflict checking

Cloudflare currently includes 25 GiB-hours of Container memory in the $5/month
Workers Paid plan, then bills additional memory, active CPU, and disk. This
project uses a 4 GiB `standard-1` instance and sleeps after 15 minutes of
inactivity, so traffic patterns determine the bill. See the current
[Containers pricing](https://developers.cloudflare.com/containers/platform/pricing/)
before deploying.

## 1. Clone and install

```bash
git clone https://github.com/modestapproach/convexbooking.git
cd convexbooking
corepack enable
corepack prepare pnpm@10.28.0 --activate
pnpm install
```

Do not create or commit ordinary `.env` files in the repository. The setup
command below writes secrets only under the ignored `.self-host/` directory.

## 2. Create the Convex project

From the backend package, sign in and create or select a project:

```bash
cd packages/backend
pnpm exec convex dev --once
```

The first run opens Convex login and project selection. It creates both a
development deployment and a production deployment. Deploy the current code to
production:

```bash
pnpm exec convex deploy
cd ../..
```

Copy the production deployment URL from the deploy output or the Convex
dashboard. It looks like:

```text
https://happy-animal-123.convex.cloud
```

The corresponding HTTP Actions URL is the same name ending in `.convex.site`.

## 3. Create the Google OAuth client

Skip this section only if you do not need Google Calendar integration.

In Google Cloud Console:

1. Create or select a project and enable the Google Calendar API.
2. Configure the OAuth consent screen. For a personal deployment, keep the app
   in Testing and add your Google account as a test user, or use an Internal app
   in a Google Workspace organization.
3. Create an OAuth 2.0 Client ID of type **Web application**.
4. Add this exact authorized redirect URI, replacing the deployment name:

   ```text
   https://happy-animal-123.convex.site/calendar/oauth/callback
   ```

5. Save the client ID and client secret for step 5.

The redirect points to Convex—not your booking hostname—because Convex performs
the server-to-server token exchange and stores the encrypted refresh token.

## 4. Protect owner login with Cloudflare Access

The public booking pages stay public. Only `/owner-login` needs Access.

In Cloudflare Zero Trust:

1. Choose a team domain, such as `your-team.cloudflareaccess.com`.
2. Add a login method. Google is convenient; One-time PIN also works.
3. Create a **Self-hosted** Access application for
   `https://booking.example.com/owner-login*`.
4. Add an Allow policy containing only your owner email address(es).
5. Copy the application's **AUD** value and your full team domain. The setup
   command asks for both.

The app verifies the Access JWT signature, issuer, audience, expiry, and email
before minting its own HTTP-only owner session cookie. Do not replace Access
with a public bypass rule.

## 5. Generate your deployment configuration

Run the guided generator from the repository root:

```bash
pnpm self-host:configure
```

It asks for:

- your final HTTPS booking URL;
- a Cloudflare Worker name;
- the production `.convex.cloud` URL;
- owner name, username, and email;
- Cloudflare Access team domain, application AUD, and allowed emails.

It creates:

| File | Contents |
| --- | --- |
| `.self-host/config.json` | your non-secret deployment choices |
| `.self-host/cloudflare-secrets.env` | generated app secrets and owner identity |
| `.self-host/convex.env` | generated backend secrets and Google OAuth placeholders |
| `app/wrangler.jsonc` | generated Worker, Container, custom-domain, and binding config |
| `app/.env.self-host` | public values baked into the Next.js client bundle |

All five files are gitignored. Secret-bearing files are written with mode 600.
Re-running the command preserves generated secrets rather than rotating them.

Open `.self-host/convex.env` and fill in the two Google values:

```dotenv
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
```

If you intentionally skipped Google Calendar, leave them empty. The rest of the
booking app still works, but connecting a calendar will be unavailable.

## 6. Configure and deploy Convex

Upload the backend environment without putting values in shell history, then
deploy once more:

```bash
cd packages/backend
pnpm exec convex env set --prod --from-file ../../.self-host/convex.env
pnpm exec convex deploy
cd ../..
```

The required production values are:

- `REFRESH_TOKEN_ENCRYPTION_KEY` — AES-256-GCM key for Google refresh tokens;
- `CALENDAR_OAUTH_STATE_SECRET` — signs short-lived OAuth state;
- `SITE_URL` — the `.convex.site` HTTP Actions origin;
- `BOOK_PUBLIC_URL` — your public Cloudflare hostname;
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` when calendar integration is enabled.

Optional integrations can add `EMAIL_API_KEY` / `EMAIL_FROM`, `TWILIO_*`,
`TURNSTILE_SECRET_KEY`, or `STRIPE_BOOKING_WEBHOOK_SECRET` later.

## 7. Deploy to Cloudflare

Log in once if Wrangler has not used this machine before:

```bash
cd app
corepack yarn install --mode=skip-build
corepack yarn workspace @calcom/web wrangler login
cd ..
```

Then run the deployment helper:

```bash
pnpm self-host:deploy
```

The helper checks Docker, installs the web workspace without running build
scripts, and runs:

```bash
wrangler deploy --config wrangler.jsonc \
  --secrets-file ../.self-host/cloudflare-secrets.env
```

Wrangler builds the Dockerfile, pushes the image to Cloudflare's managed
registry, creates the Durable Object-backed Container application, uploads the
secrets, creates the custom-domain DNS record and certificate, and deploys the
Worker. A first Container deployment can take several minutes to provision.

If the custom domain already has a CNAME, remove that record first. Cloudflare
Custom Domains create and manage their own DNS record.

## 8. Verify the deployment

```bash
curl -fsS https://YOUR-CONVEX-NAME.convex.site/health
curl -I https://booking.example.com/
curl -I https://booking.example.com/owner-login
```

Expected results:

- Convex `/health` returns `ok`.
- The public booking root returns 200 after the first cold start.
- `/owner-login` redirects to Cloudflare Access when signed out.

Then use the browser:

1. Open `/owner-login` and authenticate with an allowed email.
2. Complete the owner profile.
3. Connect Google Calendar.
4. Set weekly availability.
5. Create an event type such as `intro`.
6. Test the public URL `/intro` in a private browser window.
7. Make a real booking, confirm it appears on the calendar, then cancel it.

That last end-to-end test verifies the domain, Access policy, Convex functions,
OAuth callback, encrypted credential, slot calculation, and booking write.

## Updating

Pull, run tests, regenerate config if the template changed, and deploy:

```bash
git pull --ff-only
pnpm install --frozen-lockfile
pnpm test
pnpm self-host:configure

cd packages/backend
pnpm exec convex deploy
cd ../..
pnpm self-host:deploy
```

Wrangler keeps previous Worker versions for rollback. Use `wrangler versions
list` and `wrangler rollback` from `app/` if a web deployment is bad. Convex
deployments should be rolled forward with a corrected schema/function deploy;
review schema changes before accepting them.

## CI after the first successful local deploy

The included workflows are manual templates. Add the named GitHub repository
Secrets and Variables documented in each workflow, run them with **Actions ->
Run workflow**, and only then add a `push` trigger if you want automatic
production deployments. Keeping the first deploy local avoids guessing at
account IDs, domains, Access policy, and OAuth configuration in CI.

## Troubleshooting

### `Missing app/.env.self-host`

Run `pnpm self-host:configure`. The file carries public build-time values that
Next.js must inline; Wrangler runtime variables alone are too late.

### Worker returns 503 “Container warming up”

Wait and retry. The first deploy provisions Container infrastructure, and later
requests can cold-start after the 15-minute sleep timeout. Check Workers and
Containers logs in the Cloudflare dashboard if it persists.

### Custom domain does not deploy

The zone must be active in the same Cloudflare account and the hostname cannot
already have a CNAME. Confirm the account selected by `wrangler whoami`.

### Owner login returns 403

Check the Access application path, team domain, AUD, and allowed emails in
`.self-host/config.json`. Re-run `pnpm self-host:configure` after corrections,
then redeploy.

### Google says `redirect_uri_mismatch`

The Google OAuth client must contain the exact `.convex.site` callback printed
by the setup command, including `/calendar/oauth/callback` and no trailing
slash.

### Calendar connects but slots ignore busy events

Open Settings -> Calendars and ensure the desired calendar has conflict
checking enabled and a destination calendar selected.

## Official references

- [Cloudflare Containers: get started](https://developers.cloudflare.com/containers/get-started/)
- [Cloudflare Containers: Wrangler configuration](https://developers.cloudflare.com/containers/reference/wrangler-configuration/)
- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Convex CLI](https://docs.convex.dev/cli/overview)
- [Convex production deployment](https://docs.convex.dev/cli/reference/deploy)
- [Convex environment variables](https://docs.convex.dev/production/environment-variables)
