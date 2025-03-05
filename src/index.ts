#!/usr/bin/env node

import { server } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { startSSEServer } from "./sse.js";

async function main() {
  console.error("Starting MCP DateTime server...");
  
  // Check if the --sse flag is provided
  const useSSE = process.argv.includes("--sse");
  
  // Check if a custom port is provided with --port=XXXX
  const portArg = process.argv.find(arg => arg.startsWith("--port="));
  // Use PORT environment variable or command line argument or default to 3000
  const defaultPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const port = portArg ? parseInt(portArg.split("=")[1], 10) : defaultPort;
  
  // Check if a URI prefix is provided with --prefix=XXXX
  const prefixArg = process.argv.find(arg => arg.startsWith("--prefix="));
  // Use URI_PREFIX environment variable or command line argument or default to empty string
  const defaultPrefix = process.env.URI_PREFIX || "";
  const uriPrefix = prefixArg ? prefixArg.split("=")[1] : defaultPrefix;

  try {
    if (useSSE) {
      // Start the SSE server
      console.error(`Starting MCP DateTime server with SSE transport on port ${port}...`);
      const cleanup = startSSEServer(port, uriPrefix);
      
      // Handle graceful shutdown
      process.on("SIGINT", async () => {
        console.error("Received SIGINT, shutting down...");
        await cleanup();
        process.exit(0);
      });
      
      process.on("SIGTERM", async () => {
        console.error("Received SIGTERM, shutting down...");
        await cleanup();
        process.exit(0);
      });
    } else {
      // Connect to stdio transport
      await server.connect(new StdioServerTransport());
      console.error("MCP DateTime server connected to stdio transport");
    }
  } catch (error) {
    console.error("Error starting MCP DateTime server:", error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
}); 