import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../../lib/auth.js";
import prisma from "../../../../../lib/db.js";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { actionId } = params;
    const body = await request.json();

    const actionItem = await prisma.actionItem.findUnique({
      where: { id: actionId },
      include: { report: { select: { userId: true } } },
    });

    if (!actionItem || actionItem.report.userId !== user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.actionItem.update({
      where: { id: actionId },
      data: {
        completed: body.completed ?? actionItem.completed,
        completedAt: body.completed ? new Date() : null,
        title: body.title ?? actionItem.title,
        description: body.description ?? actionItem.description,
        priority: body.priority ?? actionItem.priority,
        dueDate: body.dueDate ? new Date(body.dueDate) : actionItem.dueDate,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating action item:", error);
    return NextResponse.json(
      { error: "Failed to update action item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { actionId } = params;

    const actionItem = await prisma.actionItem.findUnique({
      where: { id: actionId },
      include: { report: { select: { userId: true } } },
    });

    if (!actionItem || actionItem.report.userId !== user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.actionItem.delete({ where: { id: actionId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete action item" },
      { status: 500 }
    );
  }
}
