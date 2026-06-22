/**
 * POST /api/ai/chat — SSE proxy to Gemini API.
 *
 * Streams tokens from Gemini's streamGenerateContent back to the client.
 * On completion, parses the full response for JSON actions,
 * validates them, and sends a final "done" event.
 */

import { NextRequest } from "next/server";
import { AI_SYSTEM_PROMPT } from "@/shared/config";
import { validateAiAction } from "@/shared/validation";

export async function POST(req: NextRequest) {
  let body: { message?: string; apiKey?: string; model?: string } = {};
  try {
    const text = await req.text();
    body = JSON.parse(text);
    if (!body.apiKey) {
      return sseError("请在设置中填写 Gemini API Key");
    }
  } catch {
    return sseError("请求格式错误");
  }

  const encoder = new TextEncoder();
  const userMsg = body.message || "";

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";

      try {
        const model = body.model || "gemini-3.1-flash-lite";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(body.apiKey!)}`;

        const geminiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: userMsg }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
          }),
        });

        if (!geminiRes.ok) {
          let errMsg = `API 错误 (${geminiRes.status})`;
          try {
            const ej = JSON.parse(await geminiRes.text());
            errMsg = ej?.error?.message || errMsg;
          } catch {}
          enqueue(controller, encoder, { type: "error", error: errMsg });
          controller.close();
          return;
        }

        if (!geminiRes.body) {
          enqueue(controller, encoder, { type: "error", error: "空响应" });
          controller.close();
          return;
        }

        // ── Stream tokens from Gemini, stop at JSON block ──
        const reader = geminiRes.body.getReader();
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
            if (!jsonStr) continue;
            try {
              const chunk = JSON.parse(jsonStr);
              const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (!text) continue;
              fullText += text;

              if (!jsonStarted) {
                // Detect start of JSON block: {"reply", {"action", {"actions"
                const m = fullText.match(/\{\s*"(?:reply|action|actions)"/);
                if (m && m.index !== undefined) {
                  jsonStarted = true;
                  // Send any remaining text before the JSON block
                  const preJson = fullText.substring(sentLength, m.index);
                  if (preJson) enqueue(controller, encoder, { type: "token", text: preJson });
                } else {
                  // No JSON yet — stream normally
                  enqueue(controller, encoder, { type: "token", text });
                  sentLength = fullText.length;
                }
              }
              // After jsonStarted, silently accumulate for parsing
            } catch { /* skip unparseable */ }
          }
        }

        // Flush remaining buffer (respect jsonStarted flag)
        if (!jsonStarted && buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith("data: ")) {
            const js = trimmed.slice(6).trim();
            if (js && js !== "[DONE]") {
              try {
                const chunk = JSON.parse(js);
                const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (text) {
                  fullText += text;
                  const m = fullText.match(/\{\s*"(?:reply|action|actions)"/);
                  if (m && m.index !== undefined) {
                    const preJson = fullText.substring(sentLength, m.index);
                    if (preJson) enqueue(controller, encoder, { type: "token", text: preJson });
                  } else {
                    enqueue(controller, encoder, { type: "token", text });
                  }
                }
              } catch {}
            }
          }
        }

        // ── Parse JSON actions from complete response ──
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        let reply = fullText.trim();
        let displayText = reply; // text to show user (no JSON)
        let actionPayload: Record<string, unknown> = { type: "none", entity: "none", data: {} };

        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            reply = parsed.reply || reply;
            // Extract human-readable text before the JSON block
            const jsonIdx = fullText.indexOf(jsonMatch[0]);
            displayText = jsonIdx > 0 ? fullText.substring(0, jsonIdx).trim() : reply;

            const rawActions: { type: string; entity: string; data: Record<string, unknown> }[] =
              parsed.actions || (parsed.action ? [parsed.action] : []);

            const validActions = rawActions
              .filter(a => validateAiAction(a, userMsg))
              .map(a => ({ type: a.type, entity: a.entity || "none", data: a.data || {} }));

            // Include ALL actions (including queries) — client decides which to auto-execute
            const allActions = validActions.filter(a => a.type !== "none");
            const queryActions = validActions.filter(a => a.type === "query");

            if (allActions.length === 1) {
              actionPayload = { reply, action: allActions[0], displayText };
            } else if (allActions.length > 1) {
              actionPayload = { reply, actions: allActions, displayText };
            } else if (queryActions.length > 0) {
              actionPayload = { reply, actions: queryActions, displayText };
            } else {
              actionPayload = { reply, action: { type: "none", entity: "none", data: {} }, displayText };
            }
          } catch {
            actionPayload = { reply, action: { type: "none", entity: "none", data: {} }, displayText };
          }
        }

        enqueue(controller, encoder, { type: "done", ...actionPayload });
      } catch (err) {
        enqueue(controller, encoder, {
          type: "error",
          error: err instanceof Error ? err.message : "未知错误",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ── Helpers ──

function enqueue(controller: ReadableStreamDefaultController, encoder: TextEncoder, data: Record<string, unknown>) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

function sseError(msg: string) {
  return new Response(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

function flushBuffer(
  buffer: string,
  fullText: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
) {
  if (!buffer.trim()) return;
  const trimmed = buffer.trim();
  if (!trimmed.startsWith("data: ")) return;
  const jsonStr = trimmed.slice(6).trim();
  if (!jsonStr || jsonStr === "[DONE]") return;
  try {
    const chunk = JSON.parse(jsonStr);
    const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (text) {
      fullText += text;
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", text })}\n\n`));
    }
  } catch { /* skip */ }
}
