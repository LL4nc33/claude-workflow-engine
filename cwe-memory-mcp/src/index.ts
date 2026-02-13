#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "cwe-memory",
  version: "0.4.3",
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[cwe-memory] Server started on stdio");
}

main().catch((err) => {
  console.error("[cwe-memory] Fatal error:", err);
  process.exit(1);
});
