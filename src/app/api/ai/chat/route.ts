/**
 * POST /api/ai/chat — Multi-provider SSE proxy.
 *
 * Routes to Gemini / OpenAI / Claude / DeepSeek / Qwen based on user settings.
 * Streams tokens back to the client in a unified SSE format.
 */
import { NextRequest } from "next/server";
import { AI_SYSTEM_PROMPT } from "@/shared/config";
import { getProvider, DEFAULT_PROVIDER } from "@/lib/ai-providers";

export async function POST(req: NextRequest) {
  let body: { message?: string; provider?: string; model?: string; apiKey?: string } = {};
  try {
    body = await req.json();
    if (!body.apiKey) return sseError("请在设置中填写 API Key");
  } catch {
    return sseError("请求格式错误");
  }

  const provider = getProvider(body.provider || DEFAULT_PROVIDER);
  if (!provider) return sseError(`不支持的 AI 提供商: ${body.provider}`);

  const model = body.model || provider.defaultModel;
  const userMsg = body.message || "";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        const { url, init } = provider.buildRequest(model, body.apiKey!, AI_SYSTEM_PROMPT, userMsg);
        const apiRes = await fetch(url, init);

        if (!apiRes.ok) {
          let errMsg = `${provider.name} API 错误 (${apiRes.status})`;
          try { const ej = await apiRes.json(); errMsg = ej?.error?.message || errMsg; } catch {}
          enqueue(controller, encoder, { type: "error", error: errMsg });
          controller.close();
          return;
        }
        if (!apiRes.body) { enqueue(controller, encoder, { type: "error", error: "空响应" }); controller.close(); return; }

        const reader = apiRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let jsonStarted = false;
        let sentLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const chunk = JSON.parse(jsonStr);
              const text = provider.parseToken(chunk);
              if (!text) continue;
              fullText += text;

              if (!jsonStarted) {
                const m = fullText.match(/\{\s*"(?:reply|action|actions)"/);
                if (m && m.index !== undefined) {
                  jsonStarted = true;
                  const preJson = fullText.substring(sentLength, m.index);
                  if (preJson) enqueue(controller, encoder, { type: "token", text: preJson });
                } else {
                  enqueue(controller, encoder, { type: "token", text });
                  sentLength = fullText.length;
                }
              }
            } catch { /* skip */ }
          }
        }
        // Parse JSON actions
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        let reply = fullText.trim();
        let displayText = reply;
        let actionPayload: Record<string, unknown> = { type: "none", entity: "none", data: {} };
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            reply = parsed.reply || reply;
            const jsonIdx = fullText.indexOf(jsonMatch[0]);
            displayText = jsonIdx > 0 ? fullText.substring(0, jsonIdx).trim() : reply;
            const rawActions = (parsed.actions || (parsed.action ? [parsed.action] : [])) as Array<{ type: string; entity: string; data: Record<string, unknown> }>;
            const validActions = rawActions.filter(a => ["create","update","delete","query","none"].includes(a.type));
            actionPayload = validActions.length === 1
              ? { reply, action: validActions[0], displayText }
              : validActions.length > 1
                ? { reply, actions: validActions, displayText }
                : { reply, action: { type: "none", entity: "none", data: {} }, displayText };
          } catch { actionPayload = { reply, action: { type: "none", entity: "none", data: {} }, displayText }; }
        }
        enqueue(controller, encoder, { type: "done", ...actionPayload });
      } catch (err) {
        enqueue(controller, encoder, { type: "error", error: err instanceof Error ? err.message : "未知错误" });
      } finally { controller.close(); }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no" },
  });
}

function enqueue(ctrl: ReadableStreamDefaultController, enc: TextEncoder, data: Record<string, unknown>) {
  ctrl.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
}
function sseError(msg: string) {
  return new Response(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`, { headers: { "Content-Type": "text/event-stream" } });
}
