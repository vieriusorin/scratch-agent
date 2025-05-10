import type { AIMessage } from './types'
import { openai } from './ai'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod'
import { systemPrompt as defaultSystemPrompt } from './systemPrompt'
import { z } from 'zod'
import { getSummary } from './memory'
/**
 * @description Run the LLM
 * @param messages - The messages to run the LLM on
 * @param tools - The tools to use
 * @param temperature - The temperature to use
 * @param systemPrompt - The system prompt to use
 * @param conversationContext - The conversation context to use
 * @param maxTokens - The maximum number of tokens to use
 * @returns The response from the LLM
 */
export const runLLM = async ({
  messages,
  tools,
  temperature = 0.1,
  systemPrompt,
  maxTokens = 1000,
}: {
  messages: AIMessage[]
  tools?: any[],
  temperature?: number
  systemPrompt?: string,
  conversationContext?: Record<string, any>,
  maxTokens?: number,
}) => {
  const summary = await getSummary()
  const formattedTools = tools?.map(zodFunction) ?? []

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature,
    messages: [
      {
        role: 'system',
        content: `${systemPrompt || defaultSystemPrompt
          }. The conversation summary so far: ${summary}`,
      },
      ...messages,
    ],
    tools: formattedTools,
    tool_choice: 'auto',
    parallel_tool_calls: false,
    max_tokens: maxTokens,
  })

  return response.choices[0].message
}

/**
 * @description Run the approval check
 * @param userMessage - The user's message
 * @returns The approval check result
 */
export const runApprovalCheck = async (userMessage: string) => {
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
 * @param maxTokens - The maximum number of tokens to use
 * @returns - The summary of the messages, or an error message if summarization fails
 */
export const summarizeMessages = async (messages: AIMessage[], maxTokens: number = 500) => {
  try {
    // Validate input
    if (!messages || messages.length === 0) {
      return 'No messages to summarize'
    }

    if (messages.length > 100) {
      console.warn(`Large conversation (${messages.length} messages) - summarization may be slow`)
    }

    // Adjust token limit based on conversation length
    const adjustedMaxTokens = Math.min(
      maxTokens,
      Math.max(200, messages.length * 10) // At least 200, up to 10 tokens per message
    )

    const response = await runLLM({
      systemPrompt:
        'Generate a concise, chronological summary of the conversation, highlighting key points, decisions, action items, and shifts in topic. The summary should be formatted as a play-by-play that is useful for quickly regaining context in future sessions. Include references to participants (if applicable), media or links shared, and any open questions or unresolved tasks.',
      messages,
      temperature: 0.3,
      maxTokens: adjustedMaxTokens,
    })

    // Handle empty response
    if (!response || !response.content) {
      console.warn('LLM returned empty response for summarization')
      return 'Summary generation returned empty response'
    }

    return response.content
  } catch (error) {
    // Log the full error for debugging
    console.error('Failed to summarize messages:', error)

    // Different handling based on error type
    if (error instanceof Error) {
      console.error('Failed to summarize messages:', error)

      if (error.message.includes('timeout')) {
        return 'Summary generation timed out - conversation may be too long'
      }
      if (error.message.includes('rate limit')) {
        return 'Summary temporarily unavailable due to rate limiting'
      }

      if (error.message.includes('timeout')) {
        return 'Summary generation timed out - try with fewer messages or wait a moment'
      }
    }

    // Generic fallback
    return `Unable to generate summary (${messages.length} messages in conversation)`
  }
}