import { NextResponse } from "next/server";
import { generateBusinessAnalysis } from "../../../lib/business-analysis.js";
import {
  buildAnalysisCacheKey,
  checkRateLimit,
  getCachedAnalysis,
  getClientIp,
  setCachedAnalysis,
} from "../../../lib/request-controls.js";
import { getAuthenticatedUser } from "../../../lib/auth.js";
import { createReport } from "../../../lib/report-service.js";
import { resolveWorkspace } from "../../../lib/workspace-service.js";

export const runtime = "nodejs";

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientIp = getClientIp(request);
  const limit = checkRateLimit(clientIp);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please retry shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const workspace = await resolveWorkspace(user.id, body.workspaceId);
    const cacheKey = buildAnalysisCacheKey(body.idea, body.location);
    const cached = getCachedAnalysis(cacheKey);

    if (cached) {
      return NextResponse.json({
        ...cached,
        meta: {
          ...(cached.meta || {}),
          source: "cache",
        },
      });
    }

    const analysis = await generateBusinessAnalysis(body.idea, body.location);
    const payload = {
      ...analysis,
      meta: {
        source: "live",
        generatedAt: new Date().toISOString(),
      },
    };

    setCachedAnalysis(cacheKey, payload);

    const report = await createReport({
      userId: user.id,
      workspaceId: workspace.id,
      idea: String(body.idea || "").trim(),
      location: String(body.location || "").trim(),
      result: payload.result,
    });

    return NextResponse.json({
      ...payload,
      reportId: report.id,
      workspaceId: workspace.id,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const statusCode = error.statusCode || 500;

    return NextResponse.json(
      { error: error.message },
      { status: statusCode }
    );
  }
}
