import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  ResponseParseError,
  customFetch,
  setAuthTokenGetter,
  setBaseUrl,
} from "./custom-fetch";

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetch(
  response: Response | (() => Response | Promise<Response>),
): FetchMock {
  const fn = vi.fn(async () =>
    typeof response === "function" ? response() : response,
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

beforeEach(() => {
  setBaseUrl(null);
  setAuthTokenGetter(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("setBaseUrl", () => {
  it("prepends the base URL to relative paths", async () => {
    const fetchMock = mockFetch(jsonResponse({ ok: true }));
    setBaseUrl("https://api.example.com");

    await customFetch("/subjects");

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/subjects");
  });

  it("strips trailing slashes from the base URL", async () => {
    const fetchMock = mockFetch(jsonResponse({}));
    setBaseUrl("https://api.example.com///");

    await customFetch("/x");

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/x");
  });

  it("does not modify absolute URLs", async () => {
    const fetchMock = mockFetch(jsonResponse({}));
    setBaseUrl("https://api.example.com");

    await customFetch("https://other.example.org/y");

    expect(fetchMock.mock.calls[0][0]).toBe("https://other.example.org/y");
  });

  it("leaves relative paths untouched when cleared with null", async () => {
    const fetchMock = mockFetch(jsonResponse({}));
    setBaseUrl("https://api.example.com");
    setBaseUrl(null);

    await customFetch("/z");

    expect(fetchMock.mock.calls[0][0]).toBe("/z");
  });
});

describe("setAuthTokenGetter", () => {
  it("attaches a bearer token when the getter returns a value", async () => {
    const fetchMock = mockFetch(jsonResponse({}));
    setAuthTokenGetter(() => "secret-token");

    await customFetch("/secure");

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer secret-token");
  });

  it("supports async token getters", async () => {
    const fetchMock = mockFetch(jsonResponse({}));
    setAuthTokenGetter(async () => "async-token");

    await customFetch("/secure");

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer async-token");
  });

  it("does not overwrite an explicit Authorization header", async () => {
    const fetchMock = mockFetch(jsonResponse({}));
    setAuthTokenGetter(() => "secret-token");

    await customFetch("/secure", {
      headers: { authorization: "Bearer manual" },
    });

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer manual");
  });

  it("adds no header when the getter returns null", async () => {
    const fetchMock = mockFetch(jsonResponse({}));
    setAuthTokenGetter(() => null);

    await customFetch("/secure");

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Headers;
    expect(headers.has("authorization")).toBe(false);
  });
});

describe("customFetch request building", () => {
  it("rejects a body on GET requests", async () => {
    mockFetch(jsonResponse({}));
    await expect(customFetch("/x", { body: "data" })).rejects.toThrow(
      /GET requests cannot have a body/,
    );
  });

  it("rejects a body on HEAD requests", async () => {
    mockFetch(jsonResponse({}));
    await expect(
      customFetch("/x", { method: "HEAD", body: "data" }),
    ).rejects.toThrow(/HEAD requests cannot have a body/);
  });

  it("sets a JSON content-type when the body looks like JSON", async () => {
    const fetchMock = mockFetch(jsonResponse({}));

    await customFetch("/x", { method: "POST", body: '{"a":1}' });

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Headers;
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("does not override an existing content-type", async () => {
    const fetchMock = mockFetch(jsonResponse({}));

    await customFetch("/x", {
      method: "POST",
      body: '{"a":1}',
      headers: { "content-type": "text/plain" },
    });

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Headers;
    expect(headers.get("content-type")).toBe("text/plain");
  });

  it("sets an Accept header when responseType is json", async () => {
    const fetchMock = mockFetch(jsonResponse({}));

    await customFetch("/x", { responseType: "json" });

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Headers;
    expect(headers.get("accept")).toBe(
      "application/json, application/problem+json",
    );
  });
});

describe("customFetch success parsing", () => {
  it("parses a JSON response", async () => {
    mockFetch(jsonResponse({ id: 1, name: "Alice" }));
    const result = await customFetch<{ id: number; name: string }>("/x");
    expect(result).toEqual({ id: 1, name: "Alice" });
  });

  it("strips a BOM before parsing JSON", async () => {
    mockFetch(
      new Response("\uFEFF" + JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      }),
    );
    const result = await customFetch("/x", { responseType: "json" });
    expect(result).toEqual({ ok: true });
  });

  it("returns null for an empty JSON body", async () => {
    mockFetch(
      new Response("", { headers: { "content-type": "application/json" } }),
    );
    const result = await customFetch("/x", { responseType: "json" });
    expect(result).toBeNull();
  });

  it("returns null for a 204 No Content response", async () => {
    mockFetch(new Response(null, { status: 204 }));
    const result = await customFetch("/x");
    expect(result).toBeNull();
  });

  it("returns text for text responses via auto inference", async () => {
    mockFetch(
      new Response("hello", { headers: { "content-type": "text/plain" } }),
    );
    const result = await customFetch("/x");
    expect(result).toBe("hello");
  });

  it("returns null for an empty text body", async () => {
    mockFetch(new Response("", { headers: { "content-type": "text/plain" } }));
    const result = await customFetch("/x", { responseType: "text" });
    expect(result).toBeNull();
  });

  it("throws ResponseParseError on invalid JSON", async () => {
    mockFetch(
      new Response("not json", {
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(
      customFetch("/x", { responseType: "json" }),
    ).rejects.toBeInstanceOf(ResponseParseError);
  });

  it("throws a TypeError for blob responses when blob() is unavailable", async () => {
    const response = new Response("x", {
      headers: { "content-type": "application/octet-stream" },
    });
    Object.defineProperty(response, "blob", { value: undefined });
    mockFetch(response);

    await expect(customFetch("/x", { responseType: "blob" })).rejects.toThrow(
      /Blob responses are not supported/,
    );
  });
});

describe("customFetch error handling", () => {
  it("throws an ApiError for non-ok responses", async () => {
    mockFetch(
      jsonResponse(
        { title: "Not Found" },
        { status: 404, statusText: "Not Found" },
      ),
    );

    const error = await customFetch("/missing").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.data).toEqual({ title: "Not Found" });
  });

  it("builds a message from title and detail", async () => {
    mockFetch(
      jsonResponse(
        { title: "Bad Request", detail: "id is required" },
        { status: 400, statusText: "Bad Request" },
      ),
    );
    const error = (await customFetch("/x").catch((e) => e)) as ApiError;
    expect(error.message).toBe(
      "HTTP 400 Bad Request: Bad Request — id is required",
    );
  });

  it("falls back to detail when title is absent", async () => {
    mockFetch(
      jsonResponse(
        { detail: "boom" },
        { status: 500, statusText: "Server Error" },
      ),
    );
    const error = (await customFetch("/x").catch((e) => e)) as ApiError;
    expect(error.message).toBe("HTTP 500 Server Error: boom");
  });

  it("uses the message field when title and detail are absent", async () => {
    mockFetch(
      jsonResponse(
        { message: "kaput" },
        { status: 500, statusText: "Server Error" },
      ),
    );
    const error = (await customFetch("/x").catch((e) => e)) as ApiError;
    expect(error.message).toBe("HTTP 500 Server Error: kaput");
  });

  it("uses a plain-text error body", async () => {
    mockFetch(
      new Response("something failed", {
        status: 503,
        statusText: "Unavailable",
        headers: { "content-type": "text/plain" },
      }),
    );
    const error = (await customFetch("/x").catch((e) => e)) as ApiError;
    expect(error.message).toBe("HTTP 503 Unavailable: something failed");
  });

  it("uses only the prefix when the error body is empty", async () => {
    mockFetch(new Response("", { status: 500, statusText: "Server Error" }));
    const error = (await customFetch("/x").catch((e) => e)) as ApiError;
    expect(error.message).toBe("HTTP 500 Server Error");
  });
});
