import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "../../lib/http-client";

export const runtime = "edge";

/**
 * Diagnostics API Route
 * System diagnostics, health checks, and observability endpoints
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "status";

  if (action === "status") {
    const path = "diagnostics/status";
    const response = await proxyRequest(path, {
      method: "GET",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
      },
      ttl: 30, // Cache for 30 seconds
    });

    return NextResponse.json(response.data, {
      status: response.status,
      headers: {
        "X-Cached": response.cached ? "true" : "false",
      },
    });
  }

  if (action === "services") {
    const path = "diagnostics/services";
    const response = await proxyRequest(path, {
      method: "GET",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
      },
    });

    return NextResponse.json(response.data, { status: response.status });
  }

  if (action === "logs") {
    const level = searchParams.get("level") || "info";
    const limit = searchParams.get("limit") || "100";
    const path = `diagnostics/logs?level=${level}&limit=${limit}`;

    const response = await proxyRequest(path, {
      method: "GET",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
      },
    });

    return NextResponse.json(response.data, { status: response.status });
  }

  if (action === "metrics") {
    const path = "diagnostics/metrics";
    const response = await proxyRequest(path, {
      method: "GET",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
      },
    });

    return NextResponse.json(response.data, { status: response.status });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "";
  const body = await request.text();

  if (action === "run") {
    const response = await proxyRequest("diagnostics/run", {
      method: "POST",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
      body,
    });

    return NextResponse.json(response.data, { status: response.status });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
