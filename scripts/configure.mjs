#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { createInterface } from "node:readline/promises";

const nonInteractive = process.argv.includes("--non-interactive");
const root = new URL("../", import.meta.url);
const stateDir = new URL(".self-host/", root);
const configPath = new URL("config.json", stateDir);
const cloudflareSecretsPath = new URL("cloudflare-secrets.env", stateDir);
const convexEnvPath = new URL("convex.env", stateDir);
const wranglerPath = new URL("app/wrangler.jsonc", root);
const buildEnvPath = new URL("app/.env.self-host", root);

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

async function readEnv(path) {
  try {
    const out = {};
    for (const raw of (await readFile(path, "utf8")).split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const at = line.indexOf("=");
      if (at < 1) continue;
      let value = line.slice(at + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[line.slice(0, at)] = value;
    }
    return out;
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

function envLine(name, value) {
  return `${name}=${JSON.stringify(String(value))}`;
}

function normalizeUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a complete URL, including https://`);
  }
  if (url.protocol !== "https:") throw new Error(`${label} must use https://`);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`${label} must be an origin with no path, query, or fragment`);
  }
  return url.origin;
}

function validate(config) {
  config.publicUrl = normalizeUrl(config.publicUrl, "Public URL");
  config.convexUrl = normalizeUrl(config.convexUrl, "Convex URL");
  if (!config.convexUrl.endsWith(".convex.cloud")) {
    throw new Error("Convex URL must end in .convex.cloud");
  }
  config.convexSiteUrl = config.convexUrl.replace(/\.convex\.cloud$/, ".convex.site");
  config.accessTeamDomain = normalizeUrl(config.accessTeamDomain, "Access team domain");
  if (!/^[a-z0-9-]{1,63}$/.test(config.workerName)) {
    throw new Error("Worker name may contain lowercase letters, numbers, and dashes only");
  }
  if (!/^[a-z0-9][a-z0-9_-]{0,38}$/.test(config.ownerUsername)) {
    throw new Error("Owner username must start with a letter or number and use letters, numbers, _ or -");
  }
  if (!config.ownerEmail.includes("@")) throw new Error("Owner email is not valid");
  if (!config.ownerName.trim()) throw new Error("Owner display name is required");
  if (!config.appName.trim()) throw new Error("App/brand name is required");
  if (!config.accessAud.trim()) throw new Error("Cloudflare Access application AUD is required");
  const emails = config.accessAllowedEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!emails.length || emails.some((email) => !email.includes("@"))) {
    throw new Error("Access allowed emails must be a comma-separated email list");
  }
  config.accessAllowedEmails = [...new Set(emails)].join(",");
  return config;
}

const existing = await readJson(configPath);
const fromEnv = {
  publicUrl: process.env.BOOKING_PUBLIC_URL,
  workerName: process.env.BOOKING_WORKER_NAME,
  appName: process.env.BOOKING_APP_NAME,
  convexUrl: process.env.BOOKING_CONVEX_URL,
  ownerEmail: process.env.BOOKING_OWNER_EMAIL,
  ownerName: process.env.BOOKING_OWNER_NAME,
  ownerUsername: process.env.BOOKING_OWNER_USERNAME,
  accessTeamDomain: process.env.BOOKING_ACCESS_TEAM_DOMAIN,
  accessAud: process.env.BOOKING_ACCESS_AUD,
  accessAllowedEmails: process.env.BOOKING_ACCESS_ALLOWED_EMAILS,
};

const defaults = {
  publicUrl: existing.publicUrl ?? "https://booking.example.com",
  workerName: existing.workerName ?? "convex-booking",
  appName: existing.appName ?? "My Booking",
  convexUrl: existing.convexUrl ?? "",
  ownerEmail: existing.ownerEmail ?? "",
  ownerName: existing.ownerName ?? "",
  ownerUsername: existing.ownerUsername ?? "owner",
  accessTeamDomain: existing.accessTeamDomain ?? "",
  accessAud: existing.accessAud ?? "",
  accessAllowedEmails: existing.accessAllowedEmails ?? existing.ownerEmail ?? "",
};

let answers;
if (nonInteractive) {
  answers = Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [key, fromEnv[key] || fallback])
  );
} else {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (label, key) => {
    const fallback = defaults[key];
    const suffix = fallback ? ` [${fallback}]` : "";
    const value = (await rl.question(`${label}${suffix}: `)).trim();
    return value || fallback;
  };
  console.log("\nConvex Booking self-host configuration\n");
  const ownerEmail = await ask("Owner email", "ownerEmail");
  if (!defaults.accessAllowedEmails) defaults.accessAllowedEmails = ownerEmail;
  answers = {
    publicUrl: await ask("Public booking URL", "publicUrl"),
    workerName: await ask("Cloudflare Worker name", "workerName"),
    appName: await ask("App/brand name", "appName"),
    convexUrl: await ask("Production Convex URL (.convex.cloud)", "convexUrl"),
    ownerEmail,
    ownerName: await ask("Owner display name", "ownerName"),
    ownerUsername: await ask("Owner URL username", "ownerUsername"),
    accessTeamDomain: await ask("Cloudflare Access team domain", "accessTeamDomain"),
    accessAud: await ask("Cloudflare Access application AUD", "accessAud"),
    accessAllowedEmails: await ask("Allowed owner emails (comma-separated)", "accessAllowedEmails"),
  };
  rl.close();
}

const config = validate(answers);
await mkdir(stateDir, { recursive: true });

const oldCloudflareSecrets = await readEnv(cloudflareSecretsPath);
const oldConvexEnv = await readEnv(convexEnvPath);
const cloudflareSecrets = {
  NEXTAUTH_SECRET: oldCloudflareSecrets.NEXTAUTH_SECRET || randomBytes(32).toString("hex"),
  CALENDSO_ENCRYPTION_KEY:
    oldCloudflareSecrets.CALENDSO_ENCRYPTION_KEY || randomBytes(16).toString("hex"),
  OWNER_EMAIL: config.ownerEmail,
  OWNER_NAME: config.ownerName,
  OWNER_USERNAME: config.ownerUsername,
};
const convexEnv = {
  GOOGLE_CLIENT_ID: oldConvexEnv.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: oldConvexEnv.GOOGLE_CLIENT_SECRET || "",
  REFRESH_TOKEN_ENCRYPTION_KEY:
    oldConvexEnv.REFRESH_TOKEN_ENCRYPTION_KEY || randomBytes(32).toString("hex"),
  CALENDAR_OAUTH_STATE_SECRET:
    oldConvexEnv.CALENDAR_OAUTH_STATE_SECRET || randomBytes(32).toString("hex"),
  SITE_URL: config.convexSiteUrl,
  BOOK_PUBLIC_URL: config.publicUrl,
};

const wrangler = {
  $schema: "./node_modules/wrangler/config-schema.json",
  name: config.workerName,
  main: "src/index.ts",
  compatibility_date: "2026-10-17",
  compatibility_flags: ["nodejs_compat"],
  workers_dev: false,
  preview_urls: false,
  upload_source_maps: true,
  containers: [
    {
      class_name: "BookingApp",
      image: "./Dockerfile",
      max_instances: 2,
      instance_type: "standard-1",
    },
  ],
  durable_objects: {
    bindings: [{ name: "BOOKING_APP", class_name: "BookingApp" }],
  },
  migrations: [{ tag: "v1", new_sqlite_classes: ["BookingApp"] }],
  routes: [{ pattern: new URL(config.publicUrl).hostname, custom_domain: true }],
  vars: {
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_WEBAPP_URL: config.publicUrl,
    NEXT_PUBLIC_WEBSITE_URL: config.publicUrl,
    NEXT_PUBLIC_CONVEX_URL: config.convexUrl,
    NEXT_PUBLIC_CONVEX_SITE_URL: config.convexSiteUrl,
    SKIP_DB_MIGRATIONS: "1",
    ACCESS_TEAM_DOMAIN: config.accessTeamDomain,
    ACCESS_AUD: config.accessAud,
    ACCESS_ALLOWED_EMAILS: config.accessAllowedEmails,
  },
  secrets: {
    required: Object.keys(cloudflareSecrets),
  },
  observability: {
    enabled: true,
    head_sampling_rate: 1,
  },
};

const buildEnv = {
  NEXT_PUBLIC_WEBAPP_URL: config.publicUrl,
  NEXT_PUBLIC_WEBSITE_URL: config.publicUrl,
  NEXT_PUBLIC_CONVEX_URL: config.convexUrl,
  NEXT_PUBLIC_CONVEX_SITE_URL: config.convexSiteUrl,
  NEXT_PUBLIC_APP_NAME: config.appName,
};

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
await writeFile(
  cloudflareSecretsPath,
  `${Object.entries(cloudflareSecrets).map(([key, value]) => envLine(key, value)).join("\n")}\n`
);
await writeFile(
  convexEnvPath,
  `${Object.entries(convexEnv).map(([key, value]) => envLine(key, value)).join("\n")}\n`
);
await writeFile(wranglerPath, `${JSON.stringify(wrangler, null, 2)}\n`);
await writeFile(
  buildEnvPath,
  `${Object.entries(buildEnv).map(([key, value]) => envLine(key, value)).join("\n")}\n`
);
await Promise.all([
  chmod(configPath, 0o600),
  chmod(cloudflareSecretsPath, 0o600),
  chmod(convexEnvPath, 0o600),
  chmod(buildEnvPath, 0o600),
]);

console.log(`\nConfiguration written for ${config.publicUrl}`);
console.log(`Google OAuth redirect URI: ${config.convexSiteUrl}/calendar/oauth/callback`);
console.log("\nNext:");
console.log("  1. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .self-host/convex.env");
console.log("  2. cd packages/backend && pnpm exec convex env set --prod --from-file ../../.self-host/convex.env");
console.log("  3. pnpm exec convex deploy && cd ../..");
console.log("  4. pnpm self-host:deploy");
