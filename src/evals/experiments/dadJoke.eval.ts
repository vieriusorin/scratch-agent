import { runLLM } from "../../llm";
import { dadJokeToolDefinition } from "../../tools/fileJoke";
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
})

/**
 * @description Run the eval for the dadJoke tool
 * @param input - The input to the tool
 * @returns The output of the tool
 */
runEval('dadJoke', {
    task: (input) =>
        runLLM({
            messages: [{ role: 'user', content: input }],
            tools: [dadJokeToolDefinition],
        }) as Promise<any>,
    data: [
        {
            input: 'Tell me a funny dad joke',
            expected: createToolCallMessage(dadJokeToolDefinition.name),
        },
        {
            input: "take a picture of a cat",
            expected: createToolCallMessage(dadJokeToolDefinition.name),
        },
        {
            input: "Cann you tell me a joke that it will be represented as a picture",
            expected: createToolCallMessage(dadJokeToolDefinition.name),
        }
    ],
    scorers: [ToolCallMatch],
})

