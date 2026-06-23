/**
 * /api/projects/[id] — Single project CRUD.
 */

import { NextRequest, NextResponse } from "next/server";
import { projectService } from "@/core/services/service-factory";
import { jsonBody, pathId, ok } from "@/shared/api-helpers";
import { wrapHandler } from "@/shared/api-helpers";

export const dynamic = "force-dynamic";

/** GET /api/projects/:id — Project detail with tasks. */
export const GET = wrapHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = await pathId(params);
  const result = projectService.getProjectWithTasks(id);
  return NextResponse.json(result);
});

/** PATCH /api/projects/:id — Update project fields. */
export const PATCH = wrapHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = await pathId(params);
  const body = await jsonBody(_req);
  projectService.updateProject(id, body);
  return ok(null, { ok: true });
});

/** DELETE /api/projects/:id — Delete project and its tasks. */
export const DELETE = wrapHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = await pathId(params);
  projectService.deleteProject(id);
  return ok(null, { ok: true });
});
