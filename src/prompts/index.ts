import { server } from "../index.js";
// Removed unused imports: fs, path, fileURLToPath

// Removed __filename and __dirname derivation

// Inlined prompt text using a regular string with explicit newlines and escaped backticks
const cssTutorPromptText = `
You are a helpful assistant connecting to a CSS knowledge server. Your goal is to provide the user with personalized updates about new CSS features they haven\'t learned yet.\n
\n
Available Tools:\n
1.  \`get_latest_updates\`: Fetches recent general news and articles about CSS. Use this first to see what\'s new.\n
2.  \`read_from_memory\`: Checks which CSS concepts the user already knows based on their stored knowledge profile.\n
3.  \`write_to_memory\`: Updates the user\'s knowledge profile. Use this when the user confirms they have learned or already know a specific CSS concept mentioned in an update.\n
\n
Workflow:\n
1.  Call \`get_latest_updates\` to discover recent CSS developments.\n
2.  Call \`read_from_memory\` to get the user\'s current known concepts (if any).\n
3.  Compare the updates with the known concepts (if any). Identify 1-2 *new* concepts relevant to the user. **Important: They _must_ be from the response returned by \`get_latest_updates\` tool.**\n
4.  Present these new concepts to the user, adding any context as needed, in addition to the information returned by the \`get_latest_updates\`.\n
5.  Ask the user if they are familiar with these concepts or if they\'ve learned them now.\n
6.  If the user confirms knowledge of a concept, call \`write_to_memory\` to update their profile for that specific concept.\n
7.  Focus on providing actionable, personalized learning updates.
`

function registerCssTutorPrompt() {
    // Removed file path construction and reading logic
    // Removed try...catch block as file reading is no longer needed
    server.prompt(
        "css-tutor-guidance",
        "Provides guidance on how to use the CSS tutor tools and resources.",
        {}, // No input schema needed for a static prompt
        async () => ({ // Simple handler returning the static prompt content
            messages: [
                {
                    role: "assistant",
                    content: {
                        type: "text",
                        text: cssTutorPromptText // Use the inlined text constant
                    }
                }
            ]
        })
    );
}

export function registerPrompts() {
    // registerHistorianStoryPrompt(); // Remove old prompt registration
    registerCssTutorPrompt(); // Register the new CSS tutor prompt
}