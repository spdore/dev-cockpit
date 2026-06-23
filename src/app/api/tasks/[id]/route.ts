/**
 * /api/tasks/[id] — Single task update and delete.
 */

import { NextRequest } from "next/server";
import { taskService } from "@/core/services/service-factory";
import { jsonBody, pathId, ok } from "@/shared/api-helpers";
import { wrapHandler } from "@/shared/api-helpers";

export const dynamic = "force-dynamic";

/** PATCH /api/tasks/:id — Update a task's fields. */
export const PATCH = wrapHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = await pathId(params);
  const body = await jsonBody(_req);
  taskService.updateTask(id, body);
  return ok(null, { ok: true });
});

/** DELETE /api/tasks/:id — Delete a task. */
export const DELETE = wrapHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = await pathId(params);
  taskService.deleteTask(id);
  return ok(null, { ok: true });
});
