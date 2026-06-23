/**
 * /api/milestones — Milestone CRUD.
 */

import { NextRequest, NextResponse } from "next/server";
import { milestoneService } from "@/core/services/service-factory";
import { jsonBody, ok, created } from "@/shared/api-helpers";
import { wrapHandler } from "@/shared/api-helpers";

export const GET = wrapHandler(async () => {
  return NextResponse.json(milestoneService.getAllMilestones());
});

export const POST = wrapHandler(async (req: NextRequest) => {
  const body = await jsonBody(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return created({ id: milestoneService.createMilestone(body as any) });
});

export const PATCH = wrapHandler(async (req: NextRequest) => {
  const body = await jsonBody(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  milestoneService.updateMilestone(body as any);
  return ok(null, { ok: true });
});

export const DELETE = wrapHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  milestoneService.deleteMilestone(id);
  return ok(null, { ok: true });
});
