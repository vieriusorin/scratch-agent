import { runLLM } from "../../llm";
import { calendarEventToolDefinition } from "../../tools/createCalendarEvent";
import { dadJokeToolDefinition } from "../../tools/fileJoke";
import { generateImageToolDefinition } from "../../tools/generateImage";
import { getCurrentDateToolDefinition } from "../../tools/getCurrentDate";
import { movieSearchToolDefinition } from "../../tools/movieSearch";
import { redditToolDefinition } from "../../tools/reddit";
import { runEval } from "../evalTools";
import { ToolCallMatch } from "../scores";

const createToolCallMessage = (toolName: string) => ({
    role: 'assistant',
    tool_calls: [
        {
            type: 'function',
            function: { name: toolName },
        },
    ],
});

const allTools = [
    dadJokeToolDefinition,
    generateImageToolDefinition,
    redditToolDefinition,
    movieSearchToolDefinition,
    calendarEventToolDefinition,
    getCurrentDateToolDefinition,
]

/**
 * @description Run the eval for all tools
 * @param input - The input to the tool
 * @returns The output of the tool
 */
runEval('allTools', {
    task: (input) =>
        runLLM({
            messages: [{ role: 'user', content: input }],
            tools: [...allTools],
        }) as Promise<any>,
    data: [
        {
            input: 'Tell me a funny dad joke',
            expected: createToolCallMessage(dadJokeToolDefinition.name),
        },
        {
            input: "take a photo of a sun",
            expected: createToolCallMessage(generateImageToolDefinition.name),
        },
        {
            input: "tell me something cool from reddit",
            expected: createToolCallMessage(redditToolDefinition.name),
        },
    ],
    scorers: [ToolCallMatch],
})

