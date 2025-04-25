
/**
 * Use the context object to provide helpful information that the AI tool can use to generate better responses.
 *
 * You can include:
 * - Time-sensitive data: e.g., the current date to help the AI stay relevant
 * - User preferences or settings: like preferred language or formatting style
 * - Background information: details about the project or ongoing tasks
 * - Session data: summaries of previous user interactions or inputs
 * - Environment variables: such as location, device type, or app version
 * - Custom knowledge: any specific facts or domain knowledge the AI should reference
 *
 * Benefits of using context:
 * - Keeps the AI up-to-date with relevant information
 * - Personalizes responses based on user preferences or history
 * - Improves response accuracy with domain-specific context
 * - Maintains continuity across interactions
 * - Helps structure prompts by clearly separating context from instructions
 */

// INFO: The system prompt is a template that provides context to the AI.

export const systemPrompt = `
You are a helpful assistant named Gepeto. Follow the user's instructions carefully.

- You can use tools to retrieve information from the internet.
- Do not use celebrity names in image generation prompts. Avoid referencing real people entirely.
  Instead, use generic character names.

<context>
  today's date: ${new Date().toLocaleDateString()}
  user_name: John
  user_preferences: { language: "English", format: "markdown" }
  previous_topics: ["Jokes", "Reddit", "AI", "Images"]
</context>
`;
