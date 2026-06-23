/**
 * /api/tasks/[id]/toggle — Toggle task completion.
 */

import { NextRequest, NextResponse } from "next/server";
import { taskService } from "@/core/services/service-factory";
import { pathId } from "@/shared/api-helpers";
import { wrapHandler } from "@/shared/api-helpers";

export const dynamic = "force-dynamic";

/** POST /api/tasks/:id/toggle — Toggle between done and todo. */
export const POST = wrapHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = await pathId(params);
  const result = taskService.toggleTask(id);
  return NextResponse.json(result);
});
