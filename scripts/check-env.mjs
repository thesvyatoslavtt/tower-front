#!/usr/bin/env node
// Fail fast if the headless build environment is missing required env vars or
// has the wrong Node major. The factory calls this before `yarn build`; running
// it locally is a no-op for normal dev work.

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

// Required Node major (kept in lockstep with `engines.node` in package.json
// and `.nvmrc`). Update all three together.
const ALLOWED_NODE_MAJORS = [20, 22];

// Env vars required for `yarn build` to succeed in headless mode. Keep this
// list aligned with `.env.example` — anything Vite reads as `import.meta.env`
// that is mandatory at build time goes here.
const REQUIRED_ENV = [];

const errors = [];

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (Number.isNaN(nodeMajor) || !ALLOWED_NODE_MAJORS.includes(nodeMajor)) {
  errors.push(
    `Node ${ALLOWED_NODE_MAJORS.join(" or ")}.x required, got ${process.versions.node}. ` +
      `Use \`nvm use\` or align the VM image with .nvmrc.`,
  );
}

for (const key of REQUIRED_ENV) {
  if (!process.env[key] || process.env[key] === "") {
    errors.push(`Missing required env var: ${key}`);
  }
}

const examplePath = resolve(repoRoot, ".env.example");
if (existsSync(examplePath)) {
  const declared = readFileSync(examplePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("=")[0]);
  for (const key of declared) {
    if (REQUIRED_ENV.includes(key)) continue;
    if (process.env[key] === undefined) {
      process.stdout.write(`check-env: optional ${key} not set\n`);
    }
  }
}

if (errors.length > 0) {
  for (const message of errors) console.error(`check-env: ${message}`);
  process.exit(1);
}

process.stdout.write(`check-env: ok (node ${process.versions.node})\n`);
