import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { 
  COMMON_TIMEZONES, 
  getAvailableTimezones, 
  isValidTimezone, 
  getCurrentTimeInTimezone, 
  getCurrentTimezone,
  getFormattedTimezoneList
} from "./timezone-utils.js";

// Create an MCP server
export const server = new McpServer({
  name: "mcp-datetime",
  version: "0.1.0"
});

// Add a tool to get the current time in the local timezone
server.tool(
  "get-current-time",
  "Get the current time in the configured local timezone",
  async () => ({
    content: [{ 
      type: "text", 
      text: `The current time is ${getCurrentTimeInTimezone(getCurrentTimezone())}`
    }]
  })
);

// Add a tool to get the current system timezone
server.tool(
  "get-current-timezone",
  "Get the current system timezone",
  async () => {
    const timezone = getCurrentTimezone();
    return {
      content: [{ 
        type: "text", 
        text: `The current system timezone is ${timezone}`
      }]
    };
  }
);

// Add a tool to get the current time in a specific timezone
server.tool(
  "get-time-in-timezone",
  "Get the current time in a specific timezone",
  {
    timezone: z.string().describe("The timezone to get the current time for")
  },
  async (args) => {
    if (!isValidTimezone(args.timezone)) {
      return {
        content: [{ 
          type: "text", 
          text: `Error: Invalid timezone "${args.timezone}". Use the "list-timezones" tool to see available options.`
        }],
        isError: true
      };
    }
    
    return {
      content: [{ 
        type: "text", 
        text: `The current time in ${args.timezone} is ${getCurrentTimeInTimezone(args.timezone)}`
      }]
    };
  }
);

// Add a tool to list all available timezones
server.tool(
  "list-timezones",
  "List all available timezones",
  async () => {
    return {
      content: [{ 
        type: "text", 
        text: getFormattedTimezoneList()
      }]
    };
  }
);

// Create a resource template for datetime URIs
// The list method is defined to return a list of common timezones
// to avoid overwhelming the client with all available timezones
const datetimeTemplate = new ResourceTemplate("datetime://{timezone}", {
  list: async () => {
    return {
      resources: COMMON_TIMEZONES.map(timezone => ({
        uri: `datetime://${encodeURIComponent(timezone)}`,
        name: `Current time in ${timezone}`,
        description: `Get the current time in the ${timezone} timezone`,
        mimeType: "text/plain"
      }))
    };
  }
});

// Register the template with the server
server.resource(
  "datetime-template",
  datetimeTemplate,
  async (uri, variables) => {
    // Decode the timezone from the URI
    const encodedTimezone = variables.timezone as string;
    const timezone = decodeURIComponent(encodedTimezone);
    
    if (!timezone || !isValidTimezone(timezone)) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
    
    const formattedTime = getCurrentTimeInTimezone(timezone);
    return {
      contents: [{
        uri: decodeURIComponent(uri.href),
        text: `Current time in ${timezone}: ${formattedTime}`,
        mimeType: "text/plain"
      }]
    };
  }
);

// Add a resource to list all available timezones
server.resource(
  "datetime-list",
  "datetime://list",
  async () => {
    return {
      contents: [{
        uri: "datetime://list",
        text: getFormattedTimezoneList("All available timezones"),
        mimeType: "text/plain"
      }]
    };
  }
); 