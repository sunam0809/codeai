import { Router, type IRouter } from "express";
import { db, projectsTable, messagesTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/projects/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const projects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.userId, userId))
    .orderBy(desc(projectsTable.updatedAt))
    .limit(5);

  const [msgCountRow] = await db
    .select({ count: count() })
    .from(messagesTable)
    .innerJoin(projectsTable, eq(messagesTable.projectId, projectsTable.id))
    .where(eq(projectsTable.userId, userId));

  const projectsWithCount = await Promise.all(
    projects.map(async (p) => {
      const [row] = await db
        .select({ count: count() })
        .from(messagesTable)
        .where(eq(messagesTable.projectId, p.id));
      return { ...p, messageCount: Number(row?.count ?? 0) };
    })
  );

  res.json({
    totalProjects: projects.length,
    totalMessages: Number(msgCountRow?.count ?? 0),
    recentProjects: projectsWithCount,
  });
});

router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const projects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.userId, userId))
    .orderBy(desc(projectsTable.updatedAt));

  const projectsWithCount = await Promise.all(
    projects.map(async (p) => {
      const [row] = await db
        .select({ count: count() })
        .from(messagesTable)
        .where(eq(messagesTable.projectId, p.id));
      return { ...p, messageCount: Number(row?.count ?? 0) };
    })
  );

  res.json(projectsWithCount);
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: "Project name is required" });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({ userId, name, description })
    .returning();

  res.status(201).json({ ...project, messageCount: 0 });
});

router.get("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [row] = await db
    .select({ count: count() })
    .from(messagesTable)
    .where(eq(messagesTable.projectId, id));

  res.json({ ...project, messageCount: Number(row?.count ?? 0) });
});

router.patch("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const { name, description } = req.body;
  const updateData: Record<string, string> = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;

  const [project] = await db
    .update(projectsTable)
    .set(updateData)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [row] = await db
    .select({ count: count() })
    .from(messagesTable)
    .where(eq(messagesTable.projectId, id));

  res.json({ ...project, messageCount: Number(row?.count ?? 0) });
});

router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  await db.delete(messagesTable).where(eq(messagesTable.projectId, id));

  const [project] = await db
    .delete(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
