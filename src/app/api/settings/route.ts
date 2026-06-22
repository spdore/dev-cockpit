/**
 * /api/settings — Read and write user settings.
 */

import { NextRequest, NextResponse } from "next/server";
import { settingsService } from "@/core/services/service-factory";
import { jsonBody } from "@/shared/api-helpers";
import { wrapHandler } from "@/shared/api-helpers";

/** GET /api/settings — All settings (API key decrypted). */
export const GET = wrapHandler(async () => {
  const settings = settingsService.getAllSettings();
  return NextResponse.json(settings);
});

/** POST /api/settings — Save settings (API key encrypted). */
export const POST = wrapHandler(async (req: NextRequest) => {
  const body = await jsonBody<Record<string, string>>(req);
  settingsService.saveSettings(body);
  return NextResponse.json({ ok: true });
});
