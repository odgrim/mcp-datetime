import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Common timezones to ensure they're always available
const COMMON_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland"
];

// Get all available timezones using the Intl API
function getAvailableTimezones(): string[] {
  // Get all available timezones from the Intl API
  try {
    const timezones = new Set<string>(Intl.supportedValuesOf('timeZone'));
    
    // Ensure common timezones are always included
    COMMON_TIMEZONES.forEach(tz => timezones.add(tz));
    
    return Array.from(timezones).sort();
  } catch (error) {
    console.error("Error getting timezones from Intl API:", error);
    // Fallback to common timezones if the Intl API fails
    return COMMON_TIMEZONES;
  }
}

// Check if a timezone is valid
function isValidTimezone(timezone: string): boolean {
  try {
    // Try to use the timezone with Intl.DateTimeFormat
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

// Format the current date and time for a given timezone
function getCurrentTimeInTimezone(timezone: string): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timezone,
      hour12: false
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    
    // Extract parts and format as YYYY-MM-DD HH:MM:SS
    const year = parts.find(part => part.type === 'year')?.value || '';
    const month = parts.find(part => part.type === 'month')?.value || '';
    const day = parts.find(part => part.type === 'day')?.value || '';
    const hour = parts.find(part => part.type === 'hour')?.value || '';
    const minute = parts.find(part => part.type === 'minute')?.value || '';
    const second = parts.find(part => part.type === 'second')?.value || '';
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  } catch (error) {
    console.error(`Error formatting time for timezone ${timezone}:`, error);
    return `Error: Invalid timezone ${timezone}`;
  }
}

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
      text: `The current time is ${getCurrentTimeInTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)}`
    }]
  })
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
    const timezones = getAvailableTimezones();
    return {
      content: [{ 
        type: "text", 
        text: `Available timezones (${timezones.length}): ${timezones.join(',')}`
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
    // Get all available timezones
    const allTimezones = getAvailableTimezones();
    
    // Create a simple list of timezones
    const timezoneList = allTimezones.join(', ');
    
    return {
      contents: [{
        uri: "datetime://list",
        text: `All available timezones (${allTimezones.length}): ${timezoneList}`,
        mimeType: "text/plain"
      }]
    };
  }
); 