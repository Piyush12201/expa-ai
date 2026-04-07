import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/business-analysis.js", () => ({
  generateBusinessAnalysis: vi.fn(),
}));

vi.mock("../lib/auth.js", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("../lib/workspace-service.js", () => ({
  resolveWorkspace: vi.fn(),
}));

vi.mock("../lib/report-service.js", () => ({
  createReport: vi.fn(),
}));

vi.mock("../lib/request-controls.js", () => ({
  buildAnalysisCacheKey: vi.fn(() => "key"),
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  getCachedAnalysis: vi.fn(() => null),
  getClientIp: vi.fn(() => "127.0.0.1"),
  setCachedAnalysis: vi.fn(),
}));

import { POST } from "../app/api/analyze/route.js";
import { generateBusinessAnalysis } from "../lib/business-analysis.js";
import { getAuthenticatedUser } from "../lib/auth.js";
import { resolveWorkspace } from "../lib/workspace-service.js";
import { createReport } from "../lib/report-service.js";
import { checkRateLimit } from "../lib/request-controls.js";

function buildRequest(body) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    checkRateLimit.mockReturnValue({ allowed: true });
    getAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(buildRequest({ idea: "Coffee", location: "Mumbai" }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limited", async () => {
    getAuthenticatedUser.mockResolvedValue({ id: "u1" });
    checkRateLimit.mockReturnValue({ allowed: false, retryAfterSeconds: 30 });

    const response = await POST(buildRequest({ idea: "Coffee", location: "Mumbai" }));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
  });

  it("creates report for authenticated workspace", async () => {
    checkRateLimit.mockReturnValue({ allowed: true });
    getAuthenticatedUser.mockResolvedValue({ id: "u1" });
    resolveWorkspace.mockResolvedValue({ id: "w1" });
    generateBusinessAnalysis.mockResolvedValue({ success: true, result: { headline: "Good" } });
    createReport.mockResolvedValue({ id: "r1" });

    const response = await POST(buildRequest({ idea: "Coffee", location: "Mumbai", workspaceId: "w1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reportId).toBe("r1");
    expect(createReport).toHaveBeenCalled();
  });
});
