import type OpenAI from 'openai';
import { getGenerateImageTool, generateImageToolDefinition } from './tools/generateImage';
import { getRedditPosts, redditToolDefinition } from './tools/reddit';
import { getDadJoke, dadJokeTookDefinition } from './tools/fileJoke';
import { movieSearchTool, movieSearchToolDefinition } from './tools/movieSearch';
import { createCalendarEvent, calendarEventToolDefinition } from './tools/createCalendarEvent';
import { getCurrentDate, getCurrentDateToolDefinition } from './tools/getCurrentDate';

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
    case dadJokeTookDefinition.name:
      return getDadJoke(input)
    case movieSearchToolDefinition.name:
      return movieSearchTool(input)
    case calendarEventToolDefinition.name:
      return createCalendarEvent(input)
    default:
      // We tell AI to stop running this tool
      return `Never run this tool ${toolCall.function.name} again. or else!`
  }
}
