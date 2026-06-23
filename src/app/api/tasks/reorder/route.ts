/**
 * /api/tasks/reorder — Reorder today's focus list.
 */

import { NextRequest } from "next/server";
import { taskService } from "@/core/services/service-factory";
import { jsonBody, ok } from "@/shared/api-helpers";
import { wrapHandler } from "@/shared/api-helpers";

export const dynamic = "force-dynamic";

/** POST /api/tasks/reorder — Batch update today_order. */
export const POST = wrapHandler(async (req: NextRequest) => {
  const { orderedIds } = await jsonBody<{ orderedIds: string[] }>(req);
  taskService.reorderTasks(orderedIds);
  return ok(null, { ok: true });
});
