/**
 * Tiny Groq client for the insights paragraph. Free tier on Llama 3.3 70B
 * covers our usage (~5k tokens/day across all four regions × 4 cron runs).
 *
 * If GROQ_API_KEY is not set, callers should fall back to fallbackParagraph
 * from lib/insights.ts. The cron treats Groq failure as a soft failure — the
 * region JSON still gets the structured points, just with the templated prose.
 */

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export async function groqComplete(
  messages: GroqMessage[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const body = {
    model: MODEL,
    messages,
    max_tokens: opts.maxTokens ?? 200,
    temperature: opts.temperature ?? 0.4,
  };

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[groq] HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    console.warn("[groq] request failed:", err);
    return null;
  }
}
