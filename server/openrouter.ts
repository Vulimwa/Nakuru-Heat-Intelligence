const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Keep this configurable so a model can be changed without a code deployment.
// The free router automatically selects a currently available free model.
export const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "openrouter/free";

export function getOpenRouterApiKey(): string | undefined {
  const key = process.env.OPEN_ROUTER_API_KEY?.trim();
  return key && key !== "MY_OPEN_ROUTER_API_KEY" ? key : undefined;
}

export async function getOpenRouterAnswer(
  systemInstruction: string,
  userQuestion: string,
): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) throw new Error("OpenRouter API key is not configured.");

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Nakuru Heat Intelligence",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userQuestion },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const answer = payload.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error("OpenRouter returned an empty response.");

  return answer.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
    "",
  );
}
