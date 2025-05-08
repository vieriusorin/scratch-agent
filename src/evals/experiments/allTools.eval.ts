import { runLLM } from "../../llm";
import { dadJokeTookDefinition } from "../../tools/fileJoke";
import { generateImageToolDefinition } from "../../tools/generateImage";
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
    dadJokeTookDefinition,
    generateImageToolDefinition,
    redditToolDefinition,
]

/**
 * INFO: We run the eval for the reddit tool.
 * We use the runEval function to run the eval.
 * We use the runLLM function to run the model.
 * We use the createToolCallMessage function to create the tool call message.
 * We use the ToolCallMatch scorer to score the output.
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
            expected: createToolCallMessage(dadJokeTookDefinition.name),
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

