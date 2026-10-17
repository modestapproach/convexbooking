#!/usr/bin/env node

import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import process from "node:process";

const root = new URL("../", import.meta.url);
const required = [
  ".self-host/config.json",
  ".self-host/cloudflare-secrets.env",
  "app/.env.self-host",
  "app/wrangler.jsonc",
];

for (const path of required) {
  try {
    await access(new URL(path, root));
  } catch {
    console.error(`Missing ${path}. Run \"pnpm self-host:configure\" first.`);
    process.exit(1);
  }
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited ${code ?? signal}`));
    });
  });
}

const app = new URL("app/", root);
console.log("Checking Docker...");
await run("docker", ["info"], root);
console.log("Installing the web workspace (link step only)...");
await run("corepack", ["yarn", "install", "--mode=skip-build"], app);
console.log("Generating Worker binding types...");
await run(
  "corepack",
  [
    "yarn",
    "workspace",
    "@calcom/web",
    "wrangler",
    "types",
    "../../worker-configuration.d.ts",
    "--config",
    "../../wrangler.jsonc",
    "--include-runtime",
    "false",
    "--strict-vars",
    "false",
  ],
  app
);
console.log("Deploying Worker + Container to Cloudflare...");
await run(
  "corepack",
  [
    "yarn",
    "workspace",
    "@calcom/web",
    "wrangler",
    "deploy",
    "--config",
    "../../wrangler.jsonc",
    "--secrets-file",
    "../../../.self-host/cloudflare-secrets.env",
  ],
  app
);
