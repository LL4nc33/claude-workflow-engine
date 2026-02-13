#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "node:path";
import fs from "node:fs";

import { Store } from "./indexer/store.js";
import { EmbeddingService } from "./indexer/embeddings.js";
import { Indexer } from "./indexer/indexer.js";
import { SearchService } from "./search.js";
import { MemoryWatcher } from "./watcher.js";
import { registerMemorySearch } from "./tools/memory-search.js";
import { registerMemoryGet } from "./tools/memory-get.js";
import { registerMemoryWrite } from "./tools/memory-write.js";
import { registerMemoryStatus } from "./tools/memory-status.js";

const MEMORY_DIR = process.env.CWE_MEMORY_DIR || path.join(process.cwd(), "memory");
const DB_DIR = process.env.CWE_DB_DIR || path.join(process.env.HOME || "~", ".claude", "cwe", "memory");

function getProjectSlug(): string {
  const dir = path.basename(path.dirname(MEMORY_DIR));
  return dir.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
}

async function main(): Promise<void> {
  console.error(`[cwe-memory] Memory dir: ${MEMORY_DIR}`);
  console.error(`[cwe-memory] DB dir: ${DB_DIR}`);

  // Check memory dir exists
  if (!fs.existsSync(MEMORY_DIR)) {
    console.error(`[cwe-memory] Warning: Memory directory not found: ${MEMORY_DIR}`);
    console.error("[cwe-memory] Tools will return warnings until the directory is created.");
  }

  // Init components
  const store = new Store(DB_DIR, getProjectSlug());
  store.init();

  const embeddings = new EmbeddingService();
  try {
    await embeddings.init();
  } catch (err) {
    console.error("[cwe-memory] Embedding model failed to load, falling back to BM25-only:", err);
  }

  const indexer = new Indexer(store, embeddings, MEMORY_DIR);
  const searchService = new SearchService(store, embeddings);

  // Create MCP server
  const server = new McpServer({
    name: "cwe-memory",
    version: "0.4.3",
  });

  // Register tools
  registerMemorySearch(server, searchService);
  registerMemoryGet(server, MEMORY_DIR);
  registerMemoryWrite(server, MEMORY_DIR);
  registerMemoryStatus(server, store, embeddings, indexer);

  // Initial indexing
  if (fs.existsSync(MEMORY_DIR)) {
    console.error("[cwe-memory] Starting initial index...");
    const result = await indexer.indexAll();
    console.error(`[cwe-memory] Initial index done: ${result.files} files, ${result.chunks} chunks`);
  }

  // Start file watcher
  const watcher = new MemoryWatcher(
    MEMORY_DIR,
    async (filePath) => {
      await indexer.indexFile(filePath);
    },
    async (filePath) => {
      await indexer.removeFile(filePath);
    }
  );
  watcher.start();

  // Start MCP transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[cwe-memory] Server started on stdio");

  // Graceful shutdown
  const shutdown = async () => {
    console.error("[cwe-memory] Shutting down...");
    await watcher.stop();
    store.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[cwe-memory] Fatal error:", err);
  process.exit(1);
});
