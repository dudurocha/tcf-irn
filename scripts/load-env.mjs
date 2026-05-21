#!/usr/bin/env node
// Loads .env.local with OVERRIDE, then execs `next` with the given args.
// Reason: Next.js's built-in env loader does not override existing
// process.env values. If the shell exports ANTHROPIC_API_KEY="" (some
// IDEs and Claude Code do this), the empty value wins and the app fails
// with "ANTHROPIC_API_KEY is not set". This wrapper guarantees the file
// always wins for local dev/start.

import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvFile(filePath) {
  const text = readFileSync(filePath, "utf8");
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(
      /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/
    );
    if (!match) continue;
    let value = match[2];
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted) {
      value = value.slice(1, -1);
    } else {
      const hashAt = value.indexOf(" #");
      if (hashAt !== -1) value = value.slice(0, hashAt);
      value = value.trim();
    }
    out[match[1]] = value;
  }
  return out;
}

const envFile = path.join(root, ".env.local");
const overrides = [];

if (existsSync(envFile)) {
  const vars = parseEnvFile(envFile);
  for (const [key, value] of Object.entries(vars)) {
    const previous = process.env[key];
    if (previous !== value) {
      overrides.push(key);
    }
    process.env[key] = value;
  }
  console.log(
    `[load-env] Loaded ${Object.keys(vars).length} var(s) from .env.local` +
      (overrides.length ? ` (overrode shell: ${overrides.join(", ")})` : "")
  );
} else {
  console.warn(
    "[load-env] .env.local not found. Copy .env.example to .env.local and set ANTHROPIC_API_KEY."
  );
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("[load-env] Usage: node scripts/load-env.mjs <next-command> [args]");
  process.exit(1);
}

const nextBin = path.join(root, "node_modules", ".bin", "next");
const child = spawn(nextBin, args, { stdio: "inherit", env: process.env });

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
