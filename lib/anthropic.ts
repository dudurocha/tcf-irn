import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-side Anthropic client. The API key never reaches the browser.
 * Configure ANTHROPIC_API_KEY in your .env.local file.
 */
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  return new Anthropic({ apiKey });
}

export const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

interface CallOptions {
  prompt: string;
  maxTokens?: number;
  model?: string;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1000, 2500, 5000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Calls Claude with automatic retry on transient errors (overloaded, 5xx, rate limits).
 * Returns the concatenated text content from the response.
 */
export async function callClaude({
  prompt,
  maxTokens = 4000,
  model = DEFAULT_MODEL,
}: CallOptions): Promise<string> {
  const client = getClient();
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");

      if (!text.trim()) {
        throw new Error("Empty response from model");
      }

      return text;
    } catch (err) {
      lastError = err;

      const apiError = err as unknown as { status?: number; name?: string };
      const status = apiError?.status;
      const isRetryable =
        status === 429 ||
        status === 529 ||
        (typeof status === "number" && status >= 500) ||
        apiError?.name === "APIConnectionError" ||
        apiError?.name === "APIConnectionTimeoutError";

      const isLastAttempt = attempt === MAX_ATTEMPTS - 1;

      if (!isRetryable || isLastAttempt) {
        throw err;
      }

      // eslint-disable-next-line no-console
      console.warn(
        `Anthropic call failed (attempt ${attempt + 1}/${MAX_ATTEMPTS}): ${
          apiError?.message ?? String(err)
        }. Retrying in ${RETRY_DELAYS_MS[attempt]}ms…`
      );

      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError ?? new Error("Anthropic call failed after retries");
}

/**
 * Robust JSON extraction from a model response that may contain
 * markdown fences or other surrounding text.
 */
export function extractJson<T = unknown>(text: string): T {
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned) as T;
}
