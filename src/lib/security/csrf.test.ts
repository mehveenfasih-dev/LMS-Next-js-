import { describe, expect, it } from "vitest";
import { assertSameOrigin, getExpectedHost, getOriginHost } from "./csrf";

function requestWith(headers: Record<string, string>): Request {
  return new Request("http://localhost:3000/api/books", {
    method: "POST",
    headers,
  });
}

describe("csrf same-origin checks", () => {
  it("accepts a matching Origin and Host", () => {
    const request = requestWith({
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });
    expect(assertSameOrigin(request)).toBeNull();
  });

  it("accepts Referer when Origin is absent", () => {
    const request = requestWith({
      host: "localhost:3000",
      referer: "http://localhost:3000/catalog",
    });
    expect(assertSameOrigin(request)).toBeNull();
  });

  it("rejects a cross-origin Origin", async () => {
    const request = requestWith({
      host: "localhost:3000",
      origin: "https://evil.example",
    });
    const response = assertSameOrigin(request);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(403);
  });

  it("prefers x-forwarded-host for the expected host", () => {
    const request = requestWith({
      host: "127.0.0.1:3000",
      "x-forwarded-host": "books.example.com",
      origin: "https://books.example.com",
    });
    expect(getExpectedHost(request)).toBe("books.example.com");
    expect(getOriginHost(request)).toBe("books.example.com");
    expect(assertSameOrigin(request)).toBeNull();
  });

  it("rejects missing origin and referer", () => {
    const request = requestWith({ host: "localhost:3000" });
    const response = assertSameOrigin(request);
    expect(response?.status).toBe(403);
  });
});
