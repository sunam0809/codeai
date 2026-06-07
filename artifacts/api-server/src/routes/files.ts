import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const EXTENSION_MIME: Record<string, string> = {
  c: "text/x-csrc",
  cpp: "text/x-c++src",
  h: "text/x-chdr",
  hpp: "text/x-c++hdr",
  rs: "text/x-rustsrc",
  go: "text/x-gosrc",
  py: "text/x-python",
  js: "text/javascript",
  ts: "text/typescript",
  cs: "text/x-csharp",
  java: "text/x-java-source",
  asm: "text/x-asm",
  bat: "text/x-batch",
  ps1: "text/x-powershell",
  sh: "text/x-shellscript",
  exe: "application/octet-stream",
  dll: "application/octet-stream",
  sys: "application/octet-stream",
  bin: "application/octet-stream",
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
  xml: "application/xml",
  yaml: "text/yaml",
  yml: "text/yaml",
  toml: "application/toml",
  cmake: "text/plain",
  makefile: "text/plain",
};

router.post("/files/download", requireAuth, async (req, res): Promise<void> => {
  const { content, filename, extension } = req.body;

  if (!content || !filename) {
    res.status(400).json({ error: "content and filename are required" });
    return;
  }

  const ext = (extension ?? filename.split(".").pop() ?? "txt").toLowerCase().replace(/^\./, "");
  const mimeType = EXTENSION_MIME[ext] ?? "application/octet-stream";

  const safeFilename = filename.replace(/[^a-zA-Z0-9._\-]/g, "_");
  const fileBuffer = Buffer.from(content, "utf-8");

  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Length", fileBuffer.length);
  res.send(fileBuffer);
});

export default router;
