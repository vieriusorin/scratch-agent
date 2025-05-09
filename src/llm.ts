import type { AIMessage } from './types'
import { openai } from './ai'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod'
import { systemPrompt } from './systemPrompt'
import { z } from 'zod'

/**
 * 
 * INFO: Never save system prompt in the database, just append it to the user's message.
 * Messages are the user's messages and the AI's messages can be saved to database.
 */

export const runLLM = async ({
  messages,
  tools,
}: {
  messages: AIMessage[]
  tools: any[]
}) => {
  const formattedTools = tools.map(zodFunction)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    messages: [{
        role: 'system',
        content: systemPrompt,
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
        content:
          `Determine if the user EXPLICITLY approved to get the latest reddit post.
           Return true ONLY if the user clearly indicates approval with words like "yes", "approve", "create it", etc.
           Return false for all other responses including ambiguous ones.
          }`,
      },
      { role: 'user', content: userMessage },
    ],
  })

  return response.choices[0].message.parsed?.approved
}
