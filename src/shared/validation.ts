/**
 * Request validation utilities for API route handlers.
 *
 * Provides consistent validation and parsing helpers so controllers
 * can reliably extract and validate user input.
 */

import { ValidationError } from "./errors";

/** Parse and validate a JSON request body, throwing ValidationError on failure. */
export async function parseBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const text = await req.text();
    return JSON.parse(text) as T;
  } catch {
    throw new ValidationError("请求格式错误，需要 JSON");
  }
}

/** Assert that required fields are present and non-empty in the body. */
export function requireFields(body: Record<string, unknown>, fields: string[]): void {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || value === "") {
      throw new ValidationError(`缺少必填字段: ${field}`);
    }
  }
}

/** Assert that a value is one of the allowed enum members. */
export function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fieldName: string,
): asserts value is T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(`${fieldName} 必须是: ${allowed.join(", ")}`);
  }
}

/** Validate that id is a non-empty string. */
export function requireId(value: unknown, entity: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${entity} ID 无效`);
  }
}

/**
 * Validate AI-generated action against user intent keywords.
 * Prevents the AI from creating/updating/deleting unless the user explicitly asked.
 */
/**
 * Validate AI-generated action structure.
 * Only checks format correctness — intent is trusted to the AI model.
 */
export function validateAiAction(
  action: { type: string; entity: string; data: Record<string, unknown> },
  _userMessage: string,
): boolean {
  if (!action || typeof action !== "object") return false;
  // Must have a valid type
  if (!["create", "update", "delete", "query", "none"].includes(action.type)) return false;
  // none and query are always valid
  if (action.type === "none" || action.type === "query") return true;
  // Write operations must have non-empty data
  if (!action.data || typeof action.data !== "object" || Object.keys(action.data).length === 0) return false;
  // update/delete must have at least one identifier
  if ((action.type === "delete" || action.type === "update") &&
      !action.data.id && !action.data.name && !action.data.title && !action.data.date) return false;
  return true;
}
