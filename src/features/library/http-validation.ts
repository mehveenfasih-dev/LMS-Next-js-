import type { BookInput } from "./types";

export async function readBookInput(
  request: Request,
): Promise<BookInput | Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "A valid JSON body is required." }, {
      status: 400,
    });
  }
  if (!isBookInput(payload)) {
    return Response.json(
      { error: "Complete all valid book details before saving." },
      { status: 400 },
    );
  }
  return payload;
}

function isBookInput(value: unknown): value is BookInput {
  if (typeof value !== "object" || value === null) return false;
  const input = value as Record<string, unknown>;
  return (
    typeof input.title === "string" &&
    input.title.trim().length > 0 &&
    input.title.length <= 255 &&
    typeof input.author === "string" &&
    input.author.trim().length > 0 &&
    typeof input.isbn === "string" &&
    input.isbn.length <= 20 &&
    typeof input.category === "string" &&
    input.category.trim().length > 0 &&
    typeof input.year === "number" &&
    Number.isInteger(input.year) &&
    input.year >= -32768 &&
    input.year <= 32767 &&
    typeof input.publisher === "string" &&
    input.publisher.trim().length > 0 &&
    input.publisher.length <= 150 &&
    typeof input.pages === "number" &&
    Number.isInteger(input.pages) &&
    input.pages > 0 &&
    typeof input.description === "string" &&
    input.description.trim().length > 0 &&
    typeof input.totalCopies === "number" &&
    Number.isInteger(input.totalCopies) &&
    input.totalCopies > 0
  );
}
