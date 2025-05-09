import { runLLM } from "../../llm";
import { generateImageToolDefinition } from "../../tools/generateImage";
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
 * @description Run the eval for the generateImage tool
 * @param input - The input to the tool
 * @returns The output of the tool
 */
runEval('generateImage', {
    task: (input) =>
        runLLM({
            messages: [{ role: 'user', content: input }],
            tools: [generateImageToolDefinition],
        }) as Promise<any>,
    data: [
        {
            input: 'Generate an image of a cat',
            expected: createToolCallMessage(generateImageToolDefinition.name),
        },
    ],
    scorers: [ToolCallMatch],
})

