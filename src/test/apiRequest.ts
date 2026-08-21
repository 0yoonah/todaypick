import { NextRequest } from "next/server";

// route가 NextRequest를 받으므로 실제 인스턴스를 만든다.
const BASE_URL = "http://localhost:3000";

export function getRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, BASE_URL));
}

export function jsonRequest(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): NextRequest {
  return new NextRequest(new URL(path, BASE_URL), {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
