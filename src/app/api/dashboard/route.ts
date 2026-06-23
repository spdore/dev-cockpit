/**
 * /api/dashboard — Aggregated dashboard data.
 */

import { NextResponse } from "next/server";
import { dashboardService } from "@/core/services/service-factory";
import { wrapHandler } from "@/shared/api-helpers";

export const dynamic = "force-dynamic";

/** GET /api/dashboard — All dashboard widgets data in one call. */
export const GET = wrapHandler(async () => {
  const data = dashboardService.getDashboardData();
  return NextResponse.json(data);
});
