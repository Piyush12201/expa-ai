import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/auth.js", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("../lib/report-service.js", () => ({
  deleteReportsForUserWorkspace: vi.fn(),
  getReportsByWorkspace: vi.fn(),
  mapReport: vi.fn((item) => item),
}));

import { DELETE, GET } from "../app/api/history/route.js";
import { getAuthenticatedUser } from "../lib/auth.js";
import { deleteReportsForUserWorkspace, getReportsByWorkspace } from "../lib/report-service.js";

describe("/api/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthorized for GET without session", async () => {
    getAuthenticatedUser.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/history"));

    expect(response.status).toBe(401);
  });

  it("returns items for authenticated user", async () => {
    getAuthenticatedUser.mockResolvedValue({ id: "u1" });
    getReportsByWorkspace.mockResolvedValue([{ id: "r1" }]);

    const response = await GET(new Request("http://localhost/api/history"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toEqual([{ id: "r1" }]);
  });

  it("deletes workspace history for authenticated user", async () => {
    getAuthenticatedUser.mockResolvedValue({ id: "u1" });

    const response = await DELETE(new Request("http://localhost/api/history?workspaceId=w1", { method: "DELETE" }));

    expect(response.status).toBe(200);
    expect(deleteReportsForUserWorkspace).toHaveBeenCalledWith({ userId: "u1", workspaceId: "w1" });
  });
});
