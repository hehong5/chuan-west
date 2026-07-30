const SITE_ORIGIN = "https://hehong5.github.io";
const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

function headers(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin === SITE_ORIGIN ? SITE_ORIGIN : "null",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

function json(payload: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(payload), { status, headers: headers(origin) });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin") || "";
  if (origin !== SITE_ORIGIN) {
    return json({ error: { message: "Unsupported origin" } }, 403, origin);
  }
  if (request.method === "OPTIONS") return new Response(null, { headers: headers(origin) });
  if (request.method !== "POST") return json({ error: { message: "Method not allowed" } }, 405, origin);
  if (Number(request.headers.get("content-length") || 0) > 30000) {
    return json({ error: { message: "Request is too large" } }, 413, origin);
  }

  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) return json({ error: { message: "AI service is not configured" } }, 503, origin);

  try {
    const payload = await request.json();
    const messages = Array.isArray(payload?.messages)
      ? payload.messages.slice(-12).map((message: unknown) => {
          const item = message as Record<string, unknown>;
          return {
            role: ["system", "user", "assistant"].includes(String(item.role)) ? item.role : "user",
            content: String(item.content || "").slice(0, 12000),
          };
        }).filter((message: { content: string }) => message.content.trim())
      : [];

    if (!messages.length) return json({ error: { message: "Messages are required" } }, 400, origin);

    const maxTokens = Math.max(128, Math.min(Number(payload?.max_tokens) || 1200, 3200));
    const deepseekRequest = {
      model: DEEPSEEK_MODEL,
      messages,
      temperature: Math.max(0, Math.min(Number(payload?.temperature) || 0.7, 1)),
      max_tokens: maxTokens,
      thinking: { type: "disabled" },
      ...(payload?.response_format?.type === "json_object"
        ? { response_format: { type: "json_object" } }
        : {}),
    };

    const upstream = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deepseekRequest),
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: headers(origin),
    });
  } catch (error) {
    console.error("deepseek-chat", error);
    return json({ error: { message: "AI service request failed" } }, 502, origin);
  }
});
