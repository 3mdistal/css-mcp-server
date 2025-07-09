[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/3mdistal-css-mcp-server-badge.png)](https://mseep.ai/app/3mdistal-css-mcp-server)

# Building a CSS Tutor MCP Server

This repo contains a simple Model Context Protocol (MCP) server built with Node.js and TypeScript. It acts as a "CSS Tutor," providing personalized updates about CSS features to a connected AI client.

This server demonstrates key MCP concepts: defining **Resources**, **Tools**, and **Prompts**. The goal of this demonstration is to help you move on from here and build much larger and more interesting agentic capabilities.

## Prerequisites

*   Node.js (v18 or later recommended)
*   `npm` (or your preferred Node.js package manager like `yarn` or `pnpm`)
*   An AI client capable of connecting to an MCP server (e.g., the Claude desktop app)
*   An [OpenRouter API Key](https://openrouter.ai/) (for fetching live CSS updates via Perplexity)

## Quick Start

Follow these steps to get the server running quickly:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/3mdistal/css-mcp-server.git
    cd css-mcp-server
    ```

2.  **Install Dependencies:**
    ```bash
    npm install # Or: yarn install / pnpm install
    ```

3.  **Prepare API Key:** The `get_latest_updates` tool requires an OpenRouter API key. Obtain your key from [OpenRouter](https://openrouter.ai/). You will provide this key to your MCP client in Step 5.

4.  **Build the Server:** Compile the TypeScript code.
    ```bash
    npm run build # Or: yarn build / pnpm run build
    ```

5.  **Configure Your MCP Client:** Tell your client how to launch the server *and* provide the API key as an environment variable. Here's an example for the Claude desktop app's `claude_desktop_config.json`:

    ```json
    {
      "mcpServers": {
        "css-tutor": {
          "command": "node",
          "args": [
            "/full/path/to/your/css-mcp-server/build/index.js"
          ],
          "env": {
            "OPENROUTER_API_KEY": "sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxx"
          }
        }
      }
    }
    ```
    *(Ensure the path in `args` is the correct **absolute path** to the built `index.js` file on your system. Replace the placeholder API key.)*

6.  **Connect:** Start the connection from your MCP client. The client will launch the server process (with the API key in its environment), and you can start interacting!

## Using with Cursor

[Cursor](https://cursor.sh/) is an AI-first code editor that can act as an MCP client. Setting up this server with Cursor is straightforward, but requires an extra step for the guidance prompt.

1.  **Configure Server in Cursor:**
    *   Go to `Cursor Settings` > `MCP` > `Add new global MCP server`.
    *   Paste in the same JSON as above in the Claude Desktop step, with all the same caveats.

2.  **Create a Cursor Project Rule for the Prompt:** Cursor currently does not automatically use MCP prompts provided by servers. Instead, you need to provide the guidance using Cursor's [Project Rules](https://docs.cursor.com/context/rules-for-ai) feature.
    *   Create the directory `.cursor/rules` in your project root if it doesn't exist.
    *   Create a file inside it named `css-tutor.rule` (or any `.rule` filename).
    *   Paste the following guidance text into `css-tutor.rule`:

        ```text
        You are a helpful assistant connecting to a CSS knowledge server. Your goal is to provide the user with personalized updates about new CSS features they haven't learned yet.

        Available Tools:
        1.  `get_latest_updates`: Fetches recent general news and articles about CSS. Use this first to see what's new.
        2.  `read_from_memory`: Checks which CSS concepts the user already knows based on their stored knowledge profile.
        3.  `write_to_memory`: Updates the user's knowledge profile. Use this when the user confirms they have learned or already know a specific CSS concept mentioned in an update.

        Workflow:
        1.  Call `get_latest_updates` to discover recent CSS developments.
        2.  Call `read_from_memory` to get the user's current known concepts (if any).
        3.  Compare the updates with the known concepts (if any). Identify 1-2 *new* concepts relevant to the user. **Important: They _must_ be from the response returned by `get_latest_updates` tool.**
        4.  Present these new concepts to the user, adding any context as needed, in addition to the information returned by the `get_latest_updates`.
        5.  Ask the user if they are familiar with these concepts or if they've learned them now.
        6.  If the user confirms knowledge of a concept, call `write_to_memory` to update their profile for that specific concept.
        7.  Focus on providing actionable, personalized learning updates.
        ```

3.  **Connect and Use:**
    *   Ensure the `css-tutor` server is enabled in Cursor's MCP settings.
    *   Start a new chat or code generation request (e.g., Cmd+K) and include `@css-tutor-rule` (or whatever you named your rule file) in your request. This tells Cursor to load the rule's content, which includes the instructions on how to use the `read_from_memory`, `write_to_memory`, and `get_latest_updates` tools provided by the connected MCP server. 

Note that _without_ the prompt/rule, Cursor will still be able to use individual tools if you ask it to. The prompt provides a workflow and order in which to call the tools and read/write from memory.

## Understanding the Code

This section provides a higher-level overview of how the server is implemented.

### MCP Concepts Used

*   **Resource (`css_knowledge_memory`):** Represents the user's known CSS concepts, stored persistently in `data/memory.json`.
*   **Tools:** Actions the server can perform:
    *   `get_latest_updates`: Fetches CSS news from OpenRouter/Perplexity.
    *   `read_from_memory`: Reads the content of the `css_knowledge_memory` resource.
    *   `write_to_memory`: Modifies the `css_knowledge_memory` resource.
*   **Prompt (`css-tutor-guidance`):** Static instructions guiding the AI client on how to interact with the tools and resource effectively.

### Code Structure

The code is organized as follows:

*   **`data/memory.json`**: A simple JSON file acting as the database for known CSS concepts. A default version is included in the repo.
*   **`src/resources/index.ts`**: Defines the `css_knowledge_memory` resource. It includes:
    *   A Zod schema for validating the data.
    *   `readMemory` and `writeMemory` functions for file I/O.
    *   Registration using `server.resource`, specifying the `memory://` URI scheme and read/write permissions. The read handler returns the content of `data/memory.json`.
*   **`src/tools/index.ts`**: Defines the three tools using `server.tool`:
    *   `read_from_memory`: Calls `readMemory`.
    *   `write_to_memory`: Takes `concept` and `known` as input (schema defined with Zod), uses `readMemory` and `writeMemory` to update the JSON file.
    *   `get_latest_updates`: Requires `OPENROUTER_API_KEY`, calls the OpenRouter API using `node-fetch` and the `perplexity/sonar-pro` model, returns the AI-generated summary.
*   **`src/prompts/index.ts`**: Defines the static `css-tutor-guidance` prompt using `server.prompt`. The prompt text is embedded directly in the code.
*   **`src/index.ts`**: The main server entry point.
    *   Initializes the `McpServer` instance from `@modelcontextprotocol/sdk`.
    *   Imports and calls the `registerPrompts`, `registerResources`, and `registerTools` functions from the other modules.
    *   Uses `StdioServerTransport` to handle communication over standard input/output.
    *   Connects the server to the transport and includes basic error handling.
*   **`package.json`**: Defines dependencies (`@modelcontextprotocol/sdk`, `dotenv`, `node-fetch`, `zod`) and the `build` script (`tsc`).
*   **`.env.example` / `.env`**: Used for storing the `OPENROUTER_API_KEY` (if using Option A for configuration).
*   **`.gitignore`**: Configured to ignore `node_modules`, `build`, `.env`, and the contents of `data/` except for the default `data/memory.json`.
*   **`tsconfig.json`**: Standard TypeScript configuration.

## Debugging with MCP Inspector

If you need to debug the server or inspect the raw JSON-RPC messages being exchanged, you can use the `@modelcontextprotocol/inspector` tool. This tool acts as a basic MCP client and launches your server, showing you the communication flow.

Run the inspector from your terminal in the project root:

```bash
npx @modelcontextprotocol/inspector node ./build/index.js
```

**Explanation:**

*   `npx @modelcontextprotocol/inspector`: Downloads (if needed) and runs the inspector package.
*   `node`: The command used to execute your server.
*   `./build/index.js`: The path (relative to your project root) to your compiled server entry point.

**Environment Variables for Inspector:**

Note that the inspector launches your server as a child process. If your server relies on environment variables (like `OPENROUTER_API_KEY` for the `get_latest_updates` tool), you need to ensure they are available in the environment where you run the `npx` command. The `.env` file might not be automatically loaded in this context. You can typically prefix the command:

```bash
# Example on Linux/macOS
OPENROUTER_API_KEY="sk-or-xxxxxxxxxx" npx @modelcontextprotocol/inspector node ./build/index.js

# Example on Windows (Command Prompt)
set OPENROUTER_API_KEY=sk-or-xxxxxxxxxx && npx @modelcontextprotocol/inspector node ./build/index.js

# Example on Windows (PowerShell)
$env:OPENROUTER_API_KEY="sk-or-xxxxxxxxxx"; npx @modelcontextprotocol/inspector node ./build/index.js
```

Replace `sk-or-xxxxxxxxxx` with your actual key.

## Wrapping up

This demo demonstrates the core steps involved in creating a functional MCP server using the TypeScript SDK. We defined a resource to manage state, tools to perform actions (including interacting with an external API), and a prompt to guide the AI client.

Hope this demo can help you understand how to build servers that are much more complex (and useful) than this one!

(Also, if you run into any 🐛bugs, feel free to open up an issue.)