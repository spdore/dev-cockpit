/**
 * /api/daily-summary — Read and write daily work summaries.
 *
 * GET  — Returns today's status stats and the last 7 days of summaries.
 * POST — Inserts or updates a daily summary (upsert by date).
 */

import { NextRequest, NextResponse } from "next/server";
import { dailySummaryService } from "@/core/services/service-factory";
import { jsonBody, created } from "@/shared/api-helpers";
import { wrapHandler } from "@/shared/api-helpers";
import type { DailySummaryInput } from "@/core/entities";

/** GET /api/daily-summary — Today's summary + recent week history. */
export const GET = wrapHandler(async () => {
  const status = dailySummaryService.getStatusStats();
  return NextResponse.json(status);
});

/** POST /api/daily-summary — Insert or update today's summary. */
export const POST = wrapHandler(async (req: NextRequest) => {
  const body = await jsonBody<DailySummaryInput>(req);
  const id = dailySummaryService.addOrUpdate(body);
  return created({ id });
});
