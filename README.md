# MCP DateTime Server

A TypeScript implementation of a simple MCP (Model Context Protocol) server that exposes datetime information to agentic systems and chat REPLs.

## Features

- Get the current time in the local timezone
- Get the current time in a specific timezone
- List all available timezones (400+ IANA timezones supported)
- Access datetime resources through MCP URIs
- Multiple transport options: stdio and HTTP with Server-Sent Events (SSE)

## Installation

### Option 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/odgrim/mcp-datetime.git
cd mcp-datetime

# Install dependencies
npm install

# Build the project
npm run build
```

### Option 2: Run Directly with npx

You can run this package directly from GitHub without installing it locally:

```bash
# Run using npx with GitHub repository
npx github:odgrim/mcp-datetime

# Or with the shorthand syntax
npx odgrim/mcp-datetime
```

This will automatically download, install, and run the package in one command.

## Usage

### Running the server with stdio transport

```bash
# If installed locally
npm start

# Or with npx
npx odgrim/mcp-datetime
```

This will start the MCP DateTime server using stdio transport, which can be connected to by MCP clients.

### Running the server with HTTP/SSE transport

```bash
# Start the server with HTTP/SSE transport
npm run start:http
```

This will start an HTTP server (default port 3000) that provides Server-Sent Events (SSE) for MCP communication. The server exposes the following endpoints:

- `/sse` - SSE endpoint for establishing a connection
- `/messages?connectionId=<id>` - Endpoint for sending messages to the server
- `/info` - Basic server information

You can connect to this server using an MCP client that supports the SSE transport.

### Development

```bash
# Run in development mode with stdio transport
npm run dev

# Run in development mode with HTTP/SSE transport
npm run dev:http
```

## Testing with MCP Inspector

The easiest way to test and debug your MCP DateTime server is to use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), a visual testing tool for MCP servers.

### Testing stdio transport

```bash
# Test the server using MCP Inspector with local installation
npx @modelcontextprotocol/inspector node dist/index.js
```

### Testing HTTP/SSE transport

For the HTTP/SSE transport, first start the server:

```bash
npm run start:http
```

Then in a separate terminal, you can connect to it using an MCP client that supports SSE, or you can use tools like `curl` to test the SSE endpoint:

```bash
curl -N http://localhost:3000/sse
```

## Available Tools

- `get-current-time`: Get the current time in the configured local timezone
- `get-time-in-timezone`: Get the current time in a specific timezone
- `list-timezones`: List all available timezones (400+ IANA timezones)

## Available Resources

- `datetime://{timezone}/now`: Get the current time in the specified timezone
  - Note: While all IANA timezones are supported, only common timezones are listed when browsing resources

## Example

Using an MCP client, you can:

1. List available tools:
   ```
   > list tools
   - get-current-time: Get the current time in the configured local timezone
   - get-time-in-timezone: Get the current time in a specific timezone
   - list-timezones: List all available timezones
   ```

2. Call a tool:
   ```
   > call get-current-time
   The current time is 2023-03-15 14:30:45
   
   > call get-time-in-timezone {"timezone": "America/New_York"}
   The current time in America/New_York is 2023-03-15 10:30:45
   
   > call list-timezones
   Available timezones (424):
   Africa/Abidjan
   Africa/Accra
   Africa/Addis_Ababa
   ...
   ```

3. List available resources:
   ```
   > list resources
   - datetime://UTC/now: Current time in UTC
   - datetime://America/New_York/now: Current time in America/New_York
   - datetime://Europe/London/now: Current time in Europe/London
   - ...
   ```

4. Read a resource:
   ```
   > read datetime://UTC/now
   Current time in UTC: 2023-03-15 14:30:45
   ```

## License

Mozilla Public License 2.0 (MPL-2.0) 
