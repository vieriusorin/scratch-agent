import { runLLM } from "../../llm";
import { calendarEventToolDefinition } from "../../tools/createCalendarEvent";
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


runEval('create_event', {
    task: (input) =>
        runLLM({
            messages: [{ role: 'user', content: input }],
            tools: [calendarEventToolDefinition],
        }) as Promise<any>,
    data: [
        {
            input: 'Alice and Bob are going to a science fair on Friday',
            expected: createToolCallMessage(calendarEventToolDefinition.name),
        },
        {
            input: 'Jane and Joe want to go to a festival this Weekend!',
            expected: createToolCallMessage(calendarEventToolDefinition.name),
        },
        {
            input: 'Jane and Joe want to go to a festival next Weekend!',
            expected: createToolCallMessage(calendarEventToolDefinition.name),
        },
    ],
    scorers: [ToolCallMatch],
})

