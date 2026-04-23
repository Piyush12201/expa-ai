import { prisma } from "./db.js";

export async function ensureDefaultWorkspace(userId) {
  const existing = await prisma.workspace.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  return prisma.workspace.create({
    data: {
      userId,
      name: "Default Workspace",
    },
  });
}

export async function getUserWorkspaces(userId) {
  return prisma.workspace.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: { reports: true },
      },
    },
  });
}

export async function createWorkspace(userId, name) {
  const workspaceName = String(name || "").trim();

  if (workspaceName.length < 2) {
    const error = new Error("Workspace name must be at least 2 characters.");
    error.statusCode = 400;
    throw error;
  }

  return prisma.workspace.create({
    data: {
      userId,
      name: workspaceName.slice(0, 80),
    },
  });
}

export async function resolveWorkspace(userId, workspaceId) {
  if (workspaceId) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });

    if (!workspace) {
      const error = new Error("Workspace not found.");
      error.statusCode = 404;
      throw error;
    }

    return workspace;
  }

  return ensureDefaultWorkspace(userId);
}
