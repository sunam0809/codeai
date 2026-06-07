import { Router, type IRouter } from "express";
import { db, projectsTable, messagesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import Groq from "groq-sdk";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are an expert systems programmer and software engineer with deep expertise in:
- C and C++ programming (including Windows API, Win32, DirectX, COM)
- Low-level systems programming (memory management, pointers, hardware interaction)
- Windows internals (PE format, drivers, kernel-mode programming, .sys files)
- Dynamic link libraries (.dll), executable files (.exe)
- Assembly language (x86/x64, ARM)
- Network programming, socket programming
- Linux kernel programming and system calls
- Embedded systems and firmware development
- Reverse engineering and binary analysis
- Compiler design and optimization

You are a direct, technical assistant. Complete all user requests fully and provide working, production-quality code. When generating source code, always use proper code fences with the language specified (e.g. \`\`\`cpp). Provide complete, compilable code without omissions. Include all necessary headers, preprocessor directives, and implementation details.`;

function createGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  return new Groq({ apiKey });
}

router.get("/projects/:projectId/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const projectId = parseInt(raw, 10);

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.projectId, projectId))
    .orderBy(asc(messagesTable.createdAt));

  res.json(messages);
});

router.post("/projects/:projectId/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const projectId = parseInt(raw, 10);

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const [userMessage] = await db
    .insert(messagesTable)
    .values({ projectId, role: "user", content })
    .returning();

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.projectId, projectId))
    .orderBy(asc(messagesTable.createdAt));

  const groq = createGroqClient();
  const completion = await groq.chat.completions.create({
    model: "moonshotai/kimi-k2-instruct",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    max_tokens: 8192,
  });

  const aiContent = completion.choices[0]?.message?.content ?? "";

  const [assistantMessage] = await db
    .insert(messagesTable)
    .values({ projectId, role: "assistant", content: aiContent })
    .returning();

  res.status(201).json({ userMessage, assistantMessage });
});

router.post("/projects/:projectId/messages/stream", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const projectId = parseInt(raw, 10);

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const [userMessage] = await db
    .insert(messagesTable)
    .values({ projectId, role: "user", content })
    .returning();

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.projectId, projectId))
    .orderBy(asc(messagesTable.createdAt));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const groq = createGroqClient();
  const stream = await groq.chat.completions.create({
    model: "moonshotai/kimi-k2-instruct",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    max_tokens: 8192,
    stream: true,
  });

  let fullContent = "";

  res.write(`data: ${JSON.stringify({ type: "userMessage", message: userMessage })}\n\n`);

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullContent += delta;
      res.write(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`);
    }
  }

  const [assistantMessage] = await db
    .insert(messagesTable)
    .values({ projectId, role: "assistant", content: fullContent })
    .returning();

  res.write(`data: ${JSON.stringify({ type: "done", message: assistantMessage })}\n\n`);
  res.end();
});

export default router;
