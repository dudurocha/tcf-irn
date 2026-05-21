# TCF IRN Coach

A 30-day study app for the **TCF IRN** (Test de Connaissance du Français pour l'Intégration, la Résidence et la Nationalité), the language test required for French naturalization since January 2026.

Each daily lesson covers:

- **Théorie** — clear explanation of the day's grammar, vocabulary, or writing theme
- **Exemples** — 4–6 authentic B2 examples
- **Compréhension écrite** — a 200–280 word passage with 4 questions, contextually tied to the day's lesson
- **QCM** — 10 multiple-choice questions on the day's theme
- **Expression écrite** — a B2 writing prompt graded out of 25 by AI
- **Vocabulaire** — 8 vocabulary cards with Portuguese translations

The 30-day curriculum is fixed (grammar foundations → time/hypothesis → vocabulary → writing → mock exams). Content is generated on-demand by Claude and cached locally after first generation.

## Stack

- **Next.js 15** (App Router, React Server Components)
- **TypeScript**
- **Tailwind CSS** (with a custom reading-app palette)
- **Anthropic SDK** (server-side proxy — API key never reaches the browser)
- **Zod** for runtime validation of model responses

## Project structure

```
.
├── app/                       # Next.js App Router
│   ├── api/
│   │   ├── generate-lesson/   # POST: returns full lesson content
│   │   └── grade-writing/     # POST: returns score + HTML feedback
│   ├── day/[id]/              # Dynamic per-day page
│   ├── globals.css            # Tailwind + component classes
│   ├── layout.tsx
│   └── page.tsx               # Home / calendar
├── components/
│   ├── home/                  # Calendar, Stats
│   └── day/                   # DayView, Qcm, ReadingSection, WritingSection, VocabCards
└── lib/
    ├── anthropic.ts           # SDK wrapper with retry logic
    ├── api-client.ts          # Browser-side fetch helpers
    ├── curriculum.ts          # 30-day curriculum data
    ├── prompts/
    │   ├── lesson.ts          # Lesson generation prompt
    │   ├── grading.ts         # Writing evaluation prompt + parser
    │   └── scenarios.ts       # Writing scenario pool
    ├── storage/
    │   ├── progress.ts        # Progress store (localStorage today)
    │   └── use-progress.ts    # React hook
    ├── types/                 # Zod schemas + TS types
    └── utils.ts
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure your API key
cp .env.example .env.local
# Edit .env.local and set ANTHROPIC_API_KEY

# 3. Run the dev server
npm run dev
```

Get an Anthropic API key at https://console.anthropic.com/settings/keys.

## Deploy

The app is designed to deploy to Vercel out of the box:

```bash
# Push to GitHub, then:
# 1. Import the repo in Vercel
# 2. Add ANTHROPIC_API_KEY in Project Settings → Environment Variables
# 3. Deploy
```

The API routes (`/api/generate-lesson`, `/api/grade-writing`) run as serverless functions on Vercel and proxy the Anthropic API server-side. **The API key never reaches the browser.**

## Cost estimate

Approximate cost for one user completing the full 30-day plan:

| Model               | Cost per day | 30 days total |
| ------------------- | ------------ | ------------- |
| Claude Haiku 4.5    | ~$0.01–0.02  | ~$0.30–0.60   |
| Claude Sonnet 4.6 ✓ | ~$0.03–0.10  | ~$1–3         |
| Claude Opus 4.7     | ~$0.15–0.40  | ~$5–15        |

Override the default model via the `ANTHROPIC_MODEL` env var.

## Where progress is stored

Progress is stored in the browser's `localStorage` under the key `tcf-irn-progress-v2`. This means:

- Progress is per-browser, per-device (no cross-device sync yet)
- Visiting in incognito mode loses progress
- Clearing browser data resets progress

To add real persistence (sync across devices, multiple users, etc.), replace `LocalStorageStore` in `lib/storage/progress.ts` with a backend-backed implementation. The `ProgressStore` interface is designed to make this swap minimal.

## Roadmap ideas

Low-hanging fruit:

- **Export/import progress** — JSON download/upload for cross-device backup
- **Streak tracking** — daily continuity indicator
- **Spaced repetition** — vocab cards resurface after 1d / 3d / 7d intervals
- **Audio support** — generate TTS for vocabulary and reading passages (TCF IRN has oral sections too)

Larger pieces:

- **Authentication** (NextAuth + email magic links)
- **Backend persistence** (Supabase Postgres or similar)
- **Anonymous progress** synced via a device-bound token
- **Multiple users / freemium model** — first 3 days free, rest paid; bring-your-own-key option for power users
- **Custom curriculum builder** — users choose their weak spots and the schedule adapts
- **Mock exam mode** — timed, full 90-minute simulation

## Development notes

### How content is generated

`POST /api/generate-lesson` with `{ "day": 5 }`:

1. Looks up the curriculum entry for day 5
2. Builds a prompt with the theme, section, writing scenario hint, and strict constraints
3. Calls Claude with retry on transient errors
4. Parses + validates the response with Zod
5. Returns the typed `LessonContent`

If validation fails, the API returns a 502 with details, and the client surfaces the error.

### How writing is graded

`POST /api/grade-writing` with `{ writingPrompt, text }`:

1. Builds a grading prompt asking for **plain-text output** (not JSON — quotes in essays break JSON)
2. Parses the structured text into `{ score, feedback }` where `feedback` is HTML
3. Returns the result

### Why localStorage and not a backend yet

Two reasons: (a) it ships immediately with zero infra, and (b) the `ProgressStore` interface lets us swap in Supabase/Postgres later without touching the components. The hook (`use-progress.ts`) is the only consumer of the store.

## License

Personal project. Adapt freely.
