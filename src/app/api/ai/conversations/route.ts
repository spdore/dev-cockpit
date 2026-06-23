/**
 * /api/ai/conversations — AI conversation management.
 */

import { NextRequest, NextResponse } from "next/server";
import { chatService } from "@/core/services/service-factory";
import { wrapHandler } from "@/shared/api-helpers";

export const dynamic = "force-dynamic";

/** GET /api/ai/conversations — List all conversations. */
export const GET = wrapHandler(async () => {
  return NextResponse.json(chatService.getConversations());
});

/** POST /api/ai/conversations — Create a new conversation. */
export const POST = wrapHandler(async (req: NextRequest) => {
  let body: { id?: string; title?: string } = {};
  try { body = await req.json(); } catch {}

  if (body.id) {
    // Pre-defined ID (e.g. "default" created on first visit)
    const { ChatRepository } = await import("@/core/repositories");
    const { getDb } = await import("@/core/database/connection");
    new ChatRepository(getDb()).createConversation(body.id, body.title || "新对话");
    return NextResponse.json({ id: body.id });
  }

  const id = chatService.createConversation(body.title || "新对话");
  return NextResponse.json({ id });
});

/** PATCH /api/ai/conversations — Update conversation title. */
export const PATCH = wrapHandler(async (req: NextRequest) => {
  const body: { id?: string; title?: string } = await req.json().catch(() => ({}));
  if (!body.id || !body.title) return NextResponse.json({ error: "缺少 id 或 title" }, { status: 400 });
  const { getDb } = await import("@/core/database/connection");
  getDb().prepare("UPDATE conversations SET title = ? WHERE id = ?").run(body.title, body.id);
  return NextResponse.json({ ok: true });
});

/** DELETE /api/ai/conversations?id=... — Delete a conversation. */
export const DELETE = wrapHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
  chatService.deleteConversation(id);
  return NextResponse.json({ ok: true });
});
