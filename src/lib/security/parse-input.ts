import "server-only";
import type { z } from "zod";

export type ParseFormDataResult<T> =
  | { success: true; data: T }
  | { success: false };

/**
 * Parse FormData with a Zod schema. Never trust client-validated values alone;
 * the server check is authoritative.
 */
export function parseFormData<TSchema extends z.ZodType>(
  schema: TSchema,
  formData: FormData,
  keys: readonly string[],
): ParseFormDataResult<z.infer<TSchema>> {
  const raw: Record<string, FormDataEntryValue | null> = {};
  for (const key of keys) {
    raw[key] = formData.get(key);
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { success: false };
  }

  return { success: true, data: parsed.data };
}
