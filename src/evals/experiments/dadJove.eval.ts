import { runLLM } from "../../llm";
import { dadJokeTookDefinition } from "../../tools/fileJoke";
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
runEval('dadJoke', {
    task: (input) =>
        runLLM({
            messages: [{ role: 'user', content: input }],
            tools: [dadJokeTookDefinition],
        }) as Promise<any>,
    data: [
        {
            input: 'Tell me a funny dad joke',
            expected: createToolCallMessage(dadJokeTookDefinition.name),
        },
        {
            input: "take a picture of a cat",
            expected: createToolCallMessage(dadJokeTookDefinition.name),
        },
        {
            input: "Cann you tell me a joke that it will be represented as a picture",
            expected: createToolCallMessage(dadJokeTookDefinition.name),
        }
    ],
    scorers: [ToolCallMatch],
})

