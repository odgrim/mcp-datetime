#!/usr/bin/env node

import { server } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  console.error("Starting MCP DateTime server...");
  
  try {
    // Connect to stdio transport
    await server.connect(new StdioServerTransport());
    console.error("MCP DateTime server connected to stdio transport");
  } catch (error) {
    console.error("Error starting MCP DateTime server:", error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
}); 