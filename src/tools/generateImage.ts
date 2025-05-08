import { z } from 'zod';
import type { ToolFn } from '../../types';
import { openai } from '../ai';

/**
 * INFO: We define the tool definition.
 *  We use the zod library to define the parameters.
 * The parameters are the input to the tool.
 * The name is the name of the tool.
 * The description is the description of the tool.
 * The fn is the function that will be called when the tool is used.
 */
export const generateImageToolDefinition = {
    name: 'generate_image',
    description: 'Generate an image',
    parameters: z.object({
        // Info: .describe() is used to add a description to the field. to guide the user.
        prompt: z.string().describe('The prompt is used to generate an image or take a photo. Be sure to consider the style, the mood, and the context. Be sure to consider the users preferences and the users current situation. If you are unsure, ask the user for clarification.'), 
    }),
    fn: async ({ prompt }: { prompt: string }) => {
        return `Here is an image: ${prompt}`
    }
};

type Args = z.infer<typeof generateImageToolDefinition.parameters>;

export const getGenerateImageTool: ToolFn<Args, string> = async ({ toolArgs, userMessage }: { toolArgs: Args, userMessage: string }) => {
    const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: toolArgs.prompt,
        size: '1024x1024',
        quality: 'hd',
        // How many images to generate
        n: 1,
        response_format: 'url',
    });

    const imageUrl = response.data[0].url;
    
    // Ensure we always return a string to match the ToolFn<Args, string> type
    if (!imageUrl) {
        throw new Error('Failed to generate image: No URL returned');
    }
    
    return imageUrl;
}