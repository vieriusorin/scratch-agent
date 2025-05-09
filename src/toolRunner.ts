import type OpenAI from 'openai';
import { getGenerateImageTool, generateImageToolDefinition } from './tools/generateImage';
import { getRedditPosts, redditToolDefinition } from './tools/reddit';
import { getDadJoke, dadJokeToolDefinition } from './tools/fileJoke';
import { getMovieSearchTool, movieSearchToolDefinition } from './tools/movieSearch';
import { createCalendarEvent, calendarEventToolDefinition } from './tools/createCalendarEvent';
import { getCurrentDate, getCurrentDateToolDefinition } from './tools/getCurrentDate';
import { logErrorToService } from './utils/errorLogging';

/**
 * Run the tool
 * @description Responsable for running the tool based on the tool call
 * @param toolCall - The tool call
 * @param userMessage - The user message
 * @returns The results of the tool
 */
export const runTool = async (
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  userMessage: string
) => {
  const input = {
    userMessage,
    toolArgs: JSON.parse(toolCall.function.arguments || '{}'),
  }

  switch (toolCall.function.name) {
    case getCurrentDateToolDefinition.name:
      return getCurrentDate(input)
    case generateImageToolDefinition.name:
      return getGenerateImageTool(input)
    case redditToolDefinition.name:
      return getRedditPosts(input)
    case dadJokeToolDefinition.name:
      return getDadJoke(input)
    case movieSearchToolDefinition.name:
      return getMovieSearchTool(input)
    case calendarEventToolDefinition.name:
      return createCalendarEvent(input)
    default:
      // We tell AI to stop running this tool
      return handleToolError(new Error(`Tool ${toolCall.function.name} not found`), toolCall.function.name)
  }
}

/**
 * @description Handle the tool error
 * @param error - The error
 * @param toolName - The tool name
 * @returns The error
 */
export const handleToolError = (error: any, toolName: string) => {
  console.error(`Error in tool ${toolName}:`, error);
  
  // Log the error to the service
  logErrorToService({
    toolName,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // Return a user-friendly error
  return {
    success: false,
    error: 'There was an issue with this tool. Our team has been notified.',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  };
};
