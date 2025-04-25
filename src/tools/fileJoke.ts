import { z} from 'zod';
import type { ToolFn } from '../../types';
import fetch from 'node-fetch';

/**
 * INFO: We define the tool definition.
 *  We use the zod library to define the parameters.
 * The parameters are the input to the tool.
 * The name is the name of the tool.
 * The description is the description of the tool.
 * The fn is the function that will be called when the tool is used.
 */
export const dadJokeTookDefinition = {
    name: 'get_dad_joke',
    parameters: z.object({}),
    description: 'Get a dad joke',
    fn: async ({ userMessage }: { userMessage: string }) => {
        return `Here is a dad joke: ${userMessage}`
    }
}

type Args = z.infer<typeof dadJokeTookDefinition.parameters> // Creates a type from the parameters schema

export const getDadJoke: ToolFn<Args, string> = async ({ toolArgs }) => {
    const response = await fetch('https://icanhazdadjoke.com/', {
        headers: {
            Accept: 'application/json'
        }
    })

    return (await response.json()).joke
}


