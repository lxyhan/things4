import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import * as http from "node:http";
import type Database from "better-sqlite3";
import { registerCaptureTools } from "./tools/capture";
import { registerTaskTools } from "./tools/tasks";
import { registerViewTools } from "./tools/views";
import { registerProjectTools } from "./tools/projects";

export async function startMcpServer(db: Database.Database): Promise<void> {
  const server = new McpServer({ name: "things4", version: "1.0.0" });

  registerCaptureTools(server, db);
  registerTaskTools(server, db);
  registerViewTools(server, db);
  registerProjectTools(server, db);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);

  const httpServer = http.createServer(async (req, res) => {
    if (req.url !== "/mcp") {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      await transport.handleRequest(req, res);
    } catch (e) {
      if (!res.headersSent) {
        res.writeHead(500);
        res.end();
      }
    }
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(57373, "127.0.0.1", () => {
      console.log(
        "[things4] MCP server listening on http://localhost:57373/mcp",
      );
      resolve();
    });
  });
}
