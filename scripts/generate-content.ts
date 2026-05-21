#!/usr/bin/env node
/**
 * Pre-generate all 30 daily lessons and 10 mock exams using Claude.
 *
 *   npm run generate-content              # generates only missing files
 *   npm run generate-content -- --force   # overwrites everything
 *   npm run generate-content -- --model=claude-sonnet-4-6
 *   npm run generate-content -- --days=1,2,3 --exams=1,2
 *
 * Outputs to content/days/day-NN.json and content/mock-exams/exam-NN.json.
 * Reads ANTHROPIC_API_KEY from .env.local (or the shell).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { callClaude, extractJson } from "../lib/anthropic";
import { LessonContentSchema } from "../lib/types";
import { MockExamSchema } from "../lib/types/mock-exam";
import { CURRICULUM } from "../lib/curriculum";
import { buildLessonPrompt } from "../lib/prompts/lesson";
import { buildMockExamPrompt } from "../lib/prompts/mock-exam";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(ROOT, "public", "content");
const DAYS_DIR = path.join(CONTENT_DIR, "days");
const EXAMS_DIR = path.join(CONTENT_DIR, "mock-exams");
const MANIFEST_PATH = path.join(CONTENT_DIR, "manifest.json");
const TOTAL_EXAMS = 10;
const DEFAULT_MODEL = "claude-opus-4-7";
const CONCURRENCY = 3;
const MAX_RETRIES = 3;

function loadEnvLocal(): void {
  const envFile = path.join(ROOT, ".env.local");
  if (!existsSync(envFile)) return;
  const text = readFileSync(envFile, "utf8");
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
    if (quoted) value = value.slice(1, -1);
    else value = value.split(" #")[0].trim();
    process.env[match[1]] = value;
  }
}

interface Args {
  force: boolean;
  model: string;
  days: number[] | null;
  exams: number[] | null;
}

function parseArgs(): Args {
  const args: Args = { force: false, model: DEFAULT_MODEL, days: null, exams: null };
  for (const arg of process.argv.slice(2)) {
    if (arg === "--force") args.force = true;
    else if (arg.startsWith("--model=")) args.model = arg.slice("--model=".length);
    else if (arg.startsWith("--days=")) {
      args.days = arg.slice("--days=".length).split(",").map((s) => parseInt(s, 10));
    } else if (arg.startsWith("--exams=")) {
      args.exams = arg.slice("--exams=".length).split(",").map((s) => parseInt(s, 10));
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return args;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

async function generateOne(
  label: string,
  outPath: string,
  buildPrompt: () => string,
  validate: (json: unknown) => unknown,
  model: string,
  maxTokens: number
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const t0 = Date.now();
    try {
      const raw = await callClaude({
        prompt: buildPrompt(),
        maxTokens,
        model,
      });
      const json = extractJson(raw);
      const validated = validate(json);
      writeFileSync(outPath, JSON.stringify(validated, null, 2) + "\n", "utf8");
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  ✓ ${label} (${dt}s)`);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (attempt === MAX_RETRIES) {
        console.error(`  ✗ ${label} failed after ${MAX_RETRIES} attempts: ${message}`);
        throw err;
      }
      console.warn(`  ⚠ ${label} attempt ${attempt} failed (${message.slice(0, 120)}). Retrying…`);
    }
  }
}

async function runQueue<T>(items: T[], worker: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item === undefined) return;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

async function main(): Promise<void> {
  loadEnvLocal();
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    console.error("ANTHROPIC_API_KEY is not set. Add it to .env.local.");
    process.exit(1);
  }

  const args = parseArgs();
  mkdirSync(DAYS_DIR, { recursive: true });
  mkdirSync(EXAMS_DIR, { recursive: true });

  const dayTargets = CURRICULUM.filter(
    (d) => args.days === null || args.days.includes(d.day)
  );
  const examTargets = Array.from({ length: TOTAL_EXAMS }, (_, i) => i + 1).filter(
    (i) => args.exams === null || args.exams.includes(i)
  );

  const dayJobs = dayTargets
    .map((curriculumDay) => {
      const outPath = path.join(DAYS_DIR, `day-${pad(curriculumDay.day)}.json`);
      if (!args.force && existsSync(outPath)) {
        console.log(`  · day ${pad(curriculumDay.day)} already exists, skipping`);
        return null;
      }
      return { curriculumDay, outPath };
    })
    .filter((j): j is { curriculumDay: typeof CURRICULUM[number]; outPath: string } => j !== null);

  const examJobs = examTargets
    .map((i) => {
      const outPath = path.join(EXAMS_DIR, `exam-${pad(i)}.json`);
      if (!args.force && existsSync(outPath)) {
        console.log(`  · exam ${pad(i)} already exists, skipping`);
        return null;
      }
      return { index: i, outPath };
    })
    .filter((j): j is { index: number; outPath: string } => j !== null);

  console.log(`\nModel: ${args.model}`);
  console.log(`Daily lessons to generate: ${dayJobs.length}`);
  console.log(`Mock exams to generate:    ${examJobs.length}`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  if (dayJobs.length === 0 && examJobs.length === 0) {
    console.log("Nothing to do. Use --force to regenerate existing files.");
    return;
  }

  if (dayJobs.length > 0) {
    console.log("→ Daily lessons");
    await runQueue(dayJobs, async ({ curriculumDay, outPath }) => {
      await generateOne(
        `day ${pad(curriculumDay.day)} — ${curriculumDay.theme}`,
        outPath,
        () => buildLessonPrompt(curriculumDay),
        (json) => LessonContentSchema.parse(json),
        args.model,
        6500
      );
    });
  }

  if (examJobs.length > 0) {
    console.log("\n→ Mock exams");
    await runQueue(examJobs, async ({ index, outPath }) => {
      await generateOne(
        `exam ${pad(index)}`,
        outPath,
        () => buildMockExamPrompt(),
        (json) => MockExamSchema.parse(json),
        args.model,
        7000
      );
    });
  }

  writeManifest();
  console.log("\nDone.");
}

function writeManifest(): void {
  const days = readdirSync(DAYS_DIR)
    .map((f) => /^day-(\d+)\.json$/.exec(f)?.[1])
    .filter((s): s is string => !!s)
    .map((s) => parseInt(s, 10))
    .sort((a, b) => a - b);
  const exams = readdirSync(EXAMS_DIR)
    .map((f) => /^exam-(\d+)\.json$/.exec(f)?.[1])
    .filter((s): s is string => !!s)
    .map((s) => parseInt(s, 10))
    .sort((a, b) => a - b);
  const manifest = { days, exams };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Manifest: ${days.length} day(s), ${exams.length} exam(s)`);
}

main().catch((err) => {
  console.error("\nFatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
