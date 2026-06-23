/**
 * /api/ai/history — Chat message persistence.
 */

import { NextRequest, NextResponse } from "next/server";
import { chatService } from "@/core/services/service-factory";
import { wrapHandler } from "@/shared/api-helpers";

export const dynamic = "force-dynamic";

/** GET /api/ai/history?conversation_id=... — Fetch messages. */
export const GET = wrapHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const convId = searchParams.get("conversation_id") || "default";
  return NextResponse.json(chatService.getMessages(convId));
});

/** POST /api/ai/history — Save a new message. */
export const POST = wrapHandler(async (req: NextRequest) => {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id = chatService.createMessage(body as any);
  return NextResponse.json({ id });
});

/** PATCH /api/ai/history — Mark an action as executed/ignored. */
export const PATCH = wrapHandler(async (req: NextRequest) => {
  let body: { id?: number; actionIndex?: number; executed?: boolean } = {};
  try { body = await req.json(); } catch {}
  if (!body.id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  chatService.markActionExecuted(body.id, body.actionIndex ?? 0, body.executed ?? true);
  return NextResponse.json({ ok: true });
});

/** DELETE /api/ai/history?conversation_id=... — Delete messages. */
export const DELETE = wrapHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  chatService.deleteMessages(searchParams.get("conversation_id") ?? undefined);
  return NextResponse.json({ ok: true });
});
