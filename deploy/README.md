# Optional VPS deployment

Cloudflare Containers is the supported path in
[`docs/SELF_HOSTING.md`](../docs/SELF_HOSTING.md). This directory is a fallback
for running the same image on an amd64 Linux server behind a Cloudflare Tunnel.
It is useful when you prefer a continuously warm application over
scale-to-zero cold starts.

The VPS is stateless. Convex still owns bookings, availability, event types,
and encrypted calendar credentials.

## Prerequisites

- an amd64 Debian 12 or Ubuntu 24.04 server with 4 GB RAM and 20 GB disk;
- Docker Engine plus the Compose plugin;
- `cloudflared`;
- a built public GHCR image from the repository's **Build fallback image**
  workflow;
- the same Cloudflare Access application described in the main self-host guide.

Bind the application only to loopback. The included Compose file publishes
`127.0.0.1:3000`; Cloudflare Tunnel is the only public ingress.

## Configure and start

```bash
git clone https://github.com/modestapproach/convexbooking.git
cd convexbooking/deploy
cp .env.example .env
chmod 600 .env
```

Edit `.env` with your generated secrets, owner identity, Access configuration,
public URL, and Convex deployment URLs. If you built from a fork, change
`BOOKING_IMAGE` to that repository's GHCR image.

```bash
docker compose pull
docker compose up -d
docker compose logs -f
curl -fsS http://127.0.0.1:3000/api/health
```

## Create the tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create convex-booking
cloudflared tunnel route dns convex-booking booking.example.com
```

Copy `cloudflared-config.yml` to `/etc/cloudflared/config.yml`, replace
`<TUNNEL-UUID>` in both locations and `<BOOKING-HOSTNAME>` with your hostname,
then copy the tunnel credential JSON into `/etc/cloudflared/`.

```bash
sudo cloudflared --config /etc/cloudflared/config.yml service install
sudo systemctl enable --now cloudflared
cloudflared --config /etc/cloudflared/config.yml tunnel ingress validate
curl -I https://booking.example.com/
```

Keep the Cloudflare Access application on `/owner-login*`; the tunnel does not
replace authentication.

## Update and roll back

```bash
docker compose pull
docker compose up -d
```

The image workflow publishes `latest` and a commit-SHA tag. To roll back, set
`BOOKING_IMAGE=ghcr.io/OWNER/REPO:<commit-sha>` in `.env` and run
`docker compose up -d` again.
