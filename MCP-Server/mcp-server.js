import express from "express";
import fetch from "node-fetch";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================
// ⚙️ Configuration
// ==========================
const API_BASE = "https://test-mcp-k7qs.onrender.com"; // your hosted API

// ==========================
// 🧠 MCP Server Setup
// ==========================
const mcp = new McpServer({
  name: "task-manager-mcp",
  version: "1.0.0",
  description: "MCP server exposing the Task Manager REST API.",
});

// 1️⃣ List Tasks
mcp.tool(
  "list_tasks",
  {
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        _id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        status: z.string(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      })
    ),
    description: "Fetch all tasks from the Task Manager API.",
  },
  async () => {
    const res = await fetch(`${API_BASE}/tasks`);
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return await res.json();
  }
);

// 2️⃣ Create Task
mcp.tool(
  "create_task",
  {
    inputSchema: z.object({
      title: z.string(),
      description: z.string().optional(),
      status: z.enum(["pending", "in-progress", "completed"]).optional(),
    }),
    outputSchema: z.object({
      _id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      status: z.string(),
      createdAt: z.string().optional(),
    }),
    description: "Create a new task via the Task Manager API.",
  },
  async (input) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return await res.json();
  }
);

// 3️⃣ Get Task
mcp.tool(
  "get_task",
  {
    inputSchema: z.object({ id: z.string() }),
    outputSchema: z.object({
      _id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      status: z.string(),
    }),
    description: "Retrieve a single task by ID.",
  },
  async ({ id }) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`);
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return await res.json();
  }
);

// 4️⃣ Delete Task
mcp.tool(
  "delete_task",
  {
    inputSchema: z.object({ id: z.string() }),
    outputSchema: z.object({ message: z.string().optional() }),
    description: "Delete a task by ID.",
  },
  async ({ id }) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return await res.json();
  }
);

// ==========================
// 🚀 Express Wrapper for MCP HTTP interface
// ==========================
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve manifest

app.post("/mcp", async (req, res) => {
  try {
    const { tool, input } = req.body;
    const result = await mcp.callTool({ name: tool, arguments: input });
    res.json(result);
  } catch (err) {
    console.error("MCP error:", err);
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 MCP Server running at http://localhost:${PORT}`);
  console.log(`🔍 Manifest: http://localhost:${PORT}/.well-known/manifest.json`);
});
