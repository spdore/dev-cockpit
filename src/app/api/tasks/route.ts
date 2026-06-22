/**
 * /api/tasks — Task list and creation.
 */

import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/core/database/seed";
import { taskService } from "@/core/services/service-factory";
import { jsonBody, created } from "@/shared/api-helpers";
import { wrapHandler } from "@/shared/api-helpers";
seedDatabase();

/** GET /api/tasks — List all tasks with project info. */
export const GET = wrapHandler(async () => {
  const tasks = taskService.getAllTasks();
  return NextResponse.json(tasks);
});

/** POST /api/tasks — Create a new task. */
export const POST = wrapHandler(async (req: NextRequest) => {
  const body = await jsonBody(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id = taskService.createTask(body as any);
  return created({ id });
});
