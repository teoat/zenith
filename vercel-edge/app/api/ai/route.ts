import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "../../lib/http-client";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subpath = searchParams.get("subpath") || "";

  const path = `ai/${subpath}`;
  const response = await proxyRequest(path, {
    method: "GET",
    headers: {
      Authorization: request.headers.get("Authorization") || "",
    },
  });

  return NextResponse.json(response.data, {
    status: response.status,
    headers: {
      "X-Cached": response.cached ? "true" : "false",
    },
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subpath = searchParams.get("subpath") || "";
  const body = await request.text();

  const path = `ai/${subpath}`;
  const response = await proxyRequest(path, {
    method: "POST",
    headers: {
      Authorization: request.headers.get("Authorization") || "",
      "Content-Type": request.headers.get("Content-Type") || "application/json",
    },
    body,
  });

  return NextResponse.json(response.data, { status: response.status });
}
