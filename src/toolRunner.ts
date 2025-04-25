import type OpenAI from 'openai';
import { getGenerateImageTool, generateImageToolDefinition } from './tools/generateImage';
import { getRedditPosts, redditToolDefinition } from './tools/reddit';
import { getDadJoke, dadJokeTookDefinition } from './tools/fileJoke';

export const runTool = async (
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  userMessage: string
) => {
  const input = {
    userMessage,
    toolArgs: JSON.parse(toolCall.function.arguments || '{}'),
  }

  switch (toolCall.function.name) {
    case generateImageToolDefinition.name:
      return getGenerateImageTool(input)
    case redditToolDefinition.name:
      return getRedditPosts(input)
    case dadJokeTookDefinition.name:
      return getDadJoke(input)
    default:
      // We tell AI to stop running this tool
      return `Never run this tool ${toolCall.function.name} again. or else!`
  }
}
