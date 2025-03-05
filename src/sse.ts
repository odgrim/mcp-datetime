import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { server } from "./server.js";

/**
 * Creates and starts an Express server that provides SSE transport for the MCP DateTime server
 * @param port The port to listen on (defaults to PORT env var or 3000)
 * @returns A cleanup function to close the server
 */
export function startSSEServer(port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000): () => Promise<void> {
  const app = express();
  let transport: SSEServerTransport;

  // SSE endpoint for establishing a connection
  app.get("/sse", async (req, res) => {
    console.error("Received SSE connection");
    transport = new SSEServerTransport("/message", res);
    await server.connect(transport);
  });

  // Endpoint for receiving messages from the client
  app.post("/message", async (req, res) => {
    console.error("Received message");
    await transport.handlePostMessage(req, res);
  });

  // Basic info endpoint
  app.get("/info", (req, res) => {
    res.json({
      name: "MCP DateTime Server",
      version: "0.1.0",
      transport: "SSE",
      endpoints: {
        sse: "/sse",
        message: "/message"
      }
    });
  });

  // Start the server
  const httpServer = app.listen(port, () => {
    console.error(`MCP DateTime server listening on port ${port}`);
    console.error(`SSE endpoint: http://localhost:${port}/sse`);
    console.error(`Message endpoint: http://localhost:${port}/message`);
  });

  // Return a cleanup function
  return async () => {
    console.error("Closing SSE server...");
    httpServer.close();
    if (transport) {
      await server.close();
    }
  };
} 