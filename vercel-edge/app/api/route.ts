/**
 * Vercel Edge Gateway Index
 * Main entry point for the edge gateway
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: "Zenith Vercel Edge Gateway",
    version: "1.0.0",
    status: "operational",
    endpoints: {
      health: "/api/health?action=health",
      stats: "/api/health?action=stats",
      metrics: "/api/health?action=metrics",
      alerts: "/api/health?action=alerts",
      ready: "/api/health?action=ready",
      auth: "/api/auth?subpath=...",
      cases: "/api/cases?subpath=...",
      ai: "/api/ai?subpath=...",
      fraud: "/api/fraud?subpath=...",
    },
    documentation: "https://github.com/zenith-platform/docs",
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: "Method not allowed",
    message: "Use GET for gateway status",
  }, { status: 405 });
}
