/**
 * /api/projects — Project list and creation.
 */

import { NextRequest, NextResponse } from "next/server";
import { projectService } from "@/core/services/service-factory";
import { jsonBody, created } from "@/shared/api-helpers";
import { wrapHandler } from "@/shared/api-helpers";

export const dynamic = "force-dynamic";

/** GET /api/projects — List all projects with computed stats. */
export const GET = wrapHandler(async () => {
  const projects = projectService.getAllProjects();
  return NextResponse.json(projects);
});

/** POST /api/projects — Create a new project. */
export const POST = wrapHandler(async (req: NextRequest) => {
  const body = await jsonBody(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id = projectService.createProject(body as any);
  return created({ id });
});
