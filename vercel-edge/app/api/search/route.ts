import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "../../lib/http-client";

export const runtime = "edge";

/**
 * Search API Route
 * Provides unified search across cases, fraud alerts, and entities
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";
  const limit = searchParams.get("limit") || "20";
  const offset = searchParams.get("offset") || "0";

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required", code: "MISSING_QUERY" },
      { status: 400 }
    );
  }

  // Route to appropriate backend service based on type
  let path = "search";
  const queryString = `q=${encodeURIComponent(query)}&type=${type}&limit=${limit}&offset=${offset}`;

  if (type === "cases") {
    path = `cases/search?${queryString}`;
  } else if (type === "fraud") {
    path = `fraud/search?${queryString}`;
  } else if (type === "entities") {
    path = `ai/entities/search?${queryString}`;
  } else {
    // Unified search across all services
    path = `search?${queryString}`;
  }

  const response = await proxyRequest(path, {
    method: "GET",
    headers: {
      Authorization: request.headers.get("Authorization") || "",
    },
    ttl: 60, // Cache search results for 60 seconds
  });

  return NextResponse.json(response.data, {
    status: response.status,
    headers: {
      "X-Cached": response.cached ? "true" : "false",
      "X-Search-Type": type,
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  const response = await proxyRequest("search/advanced", {
    method: "POST",
    headers: {
      Authorization: request.headers.get("Authorization") || "",
      "Content-Type": "application/json",
    },
    body,
  });

  return NextResponse.json(response.data, { status: response.status });
}
