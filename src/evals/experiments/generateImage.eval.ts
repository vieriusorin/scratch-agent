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
 * INFO: We run the eval for the reddit tool.
 * We use the runEval function to run the eval.
 * We use the runLLM function to run the model.
 * We use the createToolCallMessage function to create the tool call message.
 * We use the ToolCallMatch scorer to score the output.
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

