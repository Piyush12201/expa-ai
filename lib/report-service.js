import { prisma } from "./db.js";

export async function createReport({ userId, workspaceId, idea, location, result }) {
  return prisma.report.create({
    data: {
      userId,
      workspaceId,
      idea,
      location,
      resultJson: JSON.stringify(result),
    },
    select: {
      id: true,
      idea: true,
      location: true,
      createdAt: true,
      workspaceId: true,
      resultJson: true,
    },
  });
}

export async function getReportsByWorkspace({ userId, workspaceId }) {
  return prisma.report.findMany({
    where: {
      userId,
      ...(workspaceId ? { workspaceId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      idea: true,
      location: true,
      createdAt: true,
      workspaceId: true,
      resultJson: true,
      sharedLink: {
        select: { token: true },
      },
    },
  });
}

export function mapReport(record) {
  return {
    id: record.id,
    idea: record.idea,
    location: record.location,
    workspaceId: record.workspaceId,
    createdAt: record.createdAt,
    result: JSON.parse(record.resultJson),
    shareToken: record.sharedLink?.token || null,
  };
}

export async function deleteReportsForUserWorkspace({ userId, workspaceId }) {
  return prisma.report.deleteMany({
    where: {
      userId,
      ...(workspaceId ? { workspaceId } : {}),
    },
  });
}

export async function getReportForUser({ userId, reportId }) {
  return prisma.report.findFirst({
    where: { id: reportId, userId },
    select: {
      id: true,
      idea: true,
      location: true,
      createdAt: true,
      workspaceId: true,
      resultJson: true,
    },
  });
}

export async function createOrGetShareToken(reportId) {
  const existing = await prisma.sharedReport.findUnique({
    where: { reportId },
    select: { token: true },
  });

  if (existing) {
    return existing.token;
  }

  const created = await prisma.sharedReport.create({
    data: {
      reportId,
      token: crypto.randomUUID().replace(/-/g, ""),
    },
    select: { token: true },
  });

  return created.token;
}

export async function getSharedReport(token) {
  return prisma.sharedReport.findUnique({
    where: { token },
    select: {
      token: true,
      createdAt: true,
      report: {
        select: {
          id: true,
          idea: true,
          location: true,
          createdAt: true,
          resultJson: true,
        },
      },
    },
  });
}
