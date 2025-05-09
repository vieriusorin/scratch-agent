import type { AIMessage } from './types'
import { openai } from './ai'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod'
import { systemPrompt as defaultSystemPrompt } from './systemPrompt'
import { z } from 'zod'
import { getSummary } from './memory'

/**
 * 
 * INFO: Never save system prompt in the database, just append it to the user's message.
 * Messages are the user's messages and the AI's messages can be saved to database.
 */

// Add caching layer for LLM responses
const responseCache = new Map();

export const getCachedLLMResponse = async (prompt: string, options: any) => {
  const cacheKey = JSON.stringify({ prompt, options });
  
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }
  
  const response = await runLLM(options);
  responseCache.set(cacheKey, response);
  
  return response;
};

// Add cache invalidation
export const invalidateCache = (pattern?: RegExp) => {
  if (!pattern) {
    responseCache.clear();
    return;
  }
  
  // Selectively invalidate cache entries
  for (const key of responseCache.keys()) {
    if (pattern.test(key)) {
      responseCache.delete(key);
    }
  }
};

export const runLLM = async ({
  messages,
  tools,
  temperature = 0.1,
  systemPrompt,
}: {
  messages: AIMessage[]
  tools: any[],
  temperature?: number
  systemPrompt?: string
}) => {
  const summary = await getSummary()
  const formattedTools = tools.map(zodFunction)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature,
    messages: [
      {
        role: 'system',
        content: `${
          systemPrompt || defaultSystemPrompt
        }. The conversation summary so far: ${summary}`,
      },
      ...messages,
    ],
    tools: formattedTools,
    tool_choice: 'auto',
    parallel_tool_calls: false,
  })

  return response.choices[0].message
}

/**
 * @description Run the approval check
 * @param userMessage - The user's message
 * @returns The approval check result
 */
export const runApprovalCheck = async (userMessage: string, eventDetails: any) => {
  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    response_format: zodResponseFormat(
      z.object({
        approved: z.boolean().describe('did the user EXPLICITLY approve to get the latest reddit post'),
      }),
      'math_reasoning'
    ),
    messages: [
      {
        role: 'system',
        content: `Your task is to determine whether the user has EXPLICITLY approved retrieving the latest Reddit post.
          Return 'true' ONLY if the user clearly and unambiguously approves using direct affirmations such as:
          - "yes"
          - "I approve"
          - "create it"
          - "go ahead"
          - "do it"
          - "sure, get it"
          - "please do"
          - "approve it"
          - "approve"

          Return 'false' for ALL other responses, including:
          - Vague or indirect language (e.g., "sounds good", "maybe", "I guess")
          - Questions or hypothetical statements (e.g., "Can you get it?", "If it works")
          - Emojis or symbols (e.g., 👍, ✅)
          - Sarcasm, humor, or unclear intent
          - Silence or no response
          - Conditional or partial approvals

          Be strict and conservative—ONLY return 'true' when the message leaves no doubt about the user's approval.`,
      },
      { role: 'user', content: userMessage },
    ],
  });

  return response.choices[0].message.parsed?.approved;
};


/**
 * @description Summarize the messages
 * @param messages - The messages to summarize
 * @returns - The summary of the messages
 */
export const summarizeMessages = async (messages: AIMessage[]) => {
  const response = await runLLM({
    systemPrompt:
      'Generate a concise, chronological summary of the conversation, highlighting key points, decisions, action items, and shifts in topic. The summary should be formatted as a play-by-play that is useful for quickly regaining context in future sessions. Include references to participants (if applicable), media or links shared, and any open questions or unresolved tasks.',
    messages,
    temperature: 0.3,
    tools: [] // Add empty tools array to satisfy type requirement
  })

  return response.content || ''
}
