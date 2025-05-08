import type { Scorer } from "autoevals";

/**
 * Scorers are used to score the output of a task.
 * We use the autoevals library to create scorers that is created based of the OpenAi API evals created in the phyton.
 * @param input - The input to the task
 * @param output - The output of the task
 * @param expected - The expected output of the task
 * @returns The score of the output
**/

export const ToolCallMatch: Scorer<string, string> = async ({
    input,
    output,
    expected,
}: {
    input: string
    output: {
        role: string
        tool_calls: {
            function: {
                name: string
            }
        }[]
    }
    expected: {
        role: string
        tool_calls: {
            function: {
                name: string
            }
        }[]
    }
}) => {
    const score =
        output.role === 'assistant' && Array.isArray(output.tool_calls) &&
        output.tool_calls.length === 1 &&
        output.tool_calls[0].function?.name === expected.tool_calls[0].function?.name
        ? 1 : 0;

    return {
        name: 'ToolCallMatch',
        score,
    }

}
