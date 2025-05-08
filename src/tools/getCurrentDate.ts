import { z } from 'zod';
import type { ToolFn } from '../types';

/**
 * @description Tool definition for getting the current date
 * @returns The current date
 */
export const getCurrentDateToolDefinition = {
    name: 'getCurrentDate',
    parameters: z.object({}),
    description: 'Returns the current date',
}

type Args = z.infer<typeof getCurrentDateToolDefinition.parameters>;

/**
 * @description Tool for getting the current date
 * @returns The current date
 */
export const getCurrentDate: ToolFn<Args, string> = async ({ toolArgs, userMessage }) => {
    return new Date().toLocaleDateString();
}
