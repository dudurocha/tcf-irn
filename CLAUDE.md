# Working with Claude Code on this project

This file gives Claude Code (and other AI assistants) the context needed to work productively on this codebase.

## What this project is

A 30-day study app for the **TCF IRN** French citizenship language test (B2 level). Users get a daily lesson with theory, examples, reading comprehension, QCM exercises, an AI-graded writing prompt, and vocabulary cards.

## How to run

```bash
npm install
cp .env.example .env.local  # then add your ANTHROPIC_API_KEY
npm run dev
npm run typecheck            # run before committing
npm run lint
```

## Architecture in one minute

- **Frontend**: Next.js App Router pages + client components. Progress lives in `localStorage` via the `useProgress` hook.
- **Backend**: Two API routes (`/api/generate-lesson`, `/api/grade-writing`) that proxy Claude server-side. The API key is server-only.
- **Content**: Generated on-demand by Claude. Cached in localStorage after first generation. The 30-day curriculum is static data in `lib/curriculum.ts`.
- **Validation**: All model responses are validated with Zod (`lib/types/index.ts`).

## File map you'll likely care about

| Concern                  | File                                          |
| ------------------------ | --------------------------------------------- |
| Curriculum days/themes   | `lib/curriculum.ts`                           |
| Lesson generation prompt | `lib/prompts/lesson.ts`                       |
| Writing grading prompt   | `lib/prompts/grading.ts`                      |
| Writing scenarios pool   | `lib/prompts/scenarios.ts`                    |
| API contract / types     | `lib/types/index.ts` (Zod schemas)            |
| Anthropic client + retry | `lib/anthropic.ts`                            |
| Browser → API helpers    | `lib/api-client.ts`                           |
| Progress storage         | `lib/storage/progress.ts`, `use-progress.ts`  |
| Day page UI              | `components/day/DayView.tsx` (+ sub-components) |
| Home page                | `app/page.tsx`, `components/home/`            |
| Tailwind tokens          | `tailwind.config.ts`                          |
| Global styles            | `app/globals.css`                             |

## Conventions

- **TypeScript strict mode**. No `any`. Use the Zod-inferred types from `lib/types`.
- **Server actions / API routes** validate input with Zod and return `NextResponse.json`.
- **All AI calls go through `lib/anthropic.ts`** so retries and error handling are centralized.
- **No direct `fetch('/api/...')` from components** — go through `lib/api-client.ts`.
- **Storage operations go through the `ProgressStore` interface** — don't touch `localStorage` directly in components.
- **Prompts are in `lib/prompts/`** as pure functions returning strings. Easy to test, easy to swap.
- **Tailwind**: use the custom token classes (`bg-bg`, `text-ink`, `border-accent`, etc.) rather than raw hex. The palette is in `tailwind.config.ts`.

## Adding features safely

### Adding a new lesson section type

1. Extend `LessonSection` in `lib/types/index.ts`
2. Add curriculum entries with the new section in `lib/curriculum.ts`
3. Tune the lesson prompt in `lib/prompts/lesson.ts` if needed
4. The UI auto-handles new sections — it always renders all parts of `LessonContent`

### Adding a new field to lessons

1. Extend `LessonContentSchema` in `lib/types/index.ts` (Zod)
2. Add the field to the JSON structure in `lib/prompts/lesson.ts`
3. Render it in `components/day/DayView.tsx`
4. Old cached lessons won't have the field — handle missing data gracefully or bump the storage key version in `lib/storage/progress.ts`

### Adding a backend store (when ready)

Implement `ProgressStore` against your DB of choice and export it from `lib/storage/progress.ts`. The hook and components don't change.

### Adding auth

Drop NextAuth in. The hook (`useProgress`) is the only thing that needs to know about a user ID — pass it to the store and you're done.

## Known gotchas

- **Writing grading uses plain text, not JSON** — student essays contain quotes/newlines that break JSON parsing. See `parseWritingFeedback` in `lib/prompts/grading.ts`.
- **Cached lessons can be stale** — if you change the lesson prompt, users still see old cached content until they hit `↻ Régénérer`. To force a global cache bust, bump the schema version or the storage key.
- **The model occasionally returns mismatched array lengths** (e.g. 9 QCM instead of 10). Zod will accept this unless you tighten the schema with `.length(10)`. Currently lenient by design — tighten if it becomes a problem.
- **`anthropic-dangerous-direct-browser-access` is NOT used here** — that header was for the standalone HTML prototype. This version goes through server-side API routes, which is the proper way.

## Things NOT to do without checking first

- Don't add client-side calls to `api.anthropic.com` directly — keep the API key server-side
- Don't rename Zod schemas without updating all the import sites — they're re-exported as types and runtime validators
- Don't add long-running operations to API routes without checking `maxDuration` limits on the deployment target (Vercel free tier: 10s, Pro: 60s, both set to 60 in the route files)

## Cost discipline

Each lesson generation is ~3500-6000 tokens output. Writing grading is ~600-900 tokens output. With Sonnet 4.6 as the default, a single user completing the full 30-day plan costs roughly $1-3 in Anthropic API charges. Be mindful when adding features that trigger additional model calls.
