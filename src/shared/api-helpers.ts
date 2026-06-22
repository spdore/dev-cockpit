/**
 * API route helper utilities.
 *
 * Provides consistent error handling and request parsing for Next.js route handlers.
 */

import { NextResponse } from "next/server";
import { AppError, ValidationError } from "./errors";

/**
 * Wrap a route handler with try/catch, converting AppError instances
 * to structured JSON error responses and unexpected errors to 500s.
 *
 * Accepts any NextResponse return type for flexibility.
 */
export function wrapHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { status: "error", error: err.message, code: err.statusCode },
          { status: err.statusCode },
        );
      }
      console.error("[API] Unexpected error:", err);
      return NextResponse.json(
        { status: "error", error: "服务器内部错误", code: 500 },
        { status: 500 },
      );
    }
  };
}

/**
 * Parse and validate the JSON body of a NextRequest.
 * Throws ValidationError if the body cannot be parsed.
 */
export async function jsonBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const text = await req.text();
    return JSON.parse(text) as T;
  } catch {
    throw new ValidationError("请求格式错误，需要 JSON");
  }
}

/** Extract and validate a path parameter 'id' from Next.js dynamic route params. */
export async function pathId(params: Promise<{ id: string }>): Promise<string> {
  const { id } = await params;
  if (!id || !id.trim()) {
    throw new ValidationError("缺少 ID 参数");
  }
  return id;
}

/** Extract and validate a query parameter. */
export function queryParam(req: Request, name: string): string | undefined {
  const { searchParams } = new URL(req.url);
  return searchParams.get(name) ?? undefined;
}

/** Build a generic success response. */
export function ok(data?: unknown, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ ...(data !== undefined ? { data } : {}), ...extra });
}

/** Build a created (201) response. */
export function created(data: Record<string, unknown>): NextResponse {
  return NextResponse.json(data, { status: 201 });
}
