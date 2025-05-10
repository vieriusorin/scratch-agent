import { JSONFilePreset } from 'lowdb/node'
import type { AIMessage } from './types'
import { v4 as uuidv4 } from 'uuid'
import { summarizeMessages } from './llm'

export type MessageWithMetadata = AIMessage & {
  id: string
  createdAt: string
}

type Data = {
  messages: MessageWithMetadata[]
  summary: string
}

/**
 * @description Add the metadata to the message
 * @param message - The message to add the metadata to
 * @returns The message with the metadata
 */
export const addMetadata = (message: AIMessage) => {
  return {
    ...message,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }
}

/**
 * @description Remove the metadata from the message
 * @param message - The message to remove the metadata from
 * @returns The message without the metadata
 */
export const removeMetadata = (message: MessageWithMetadata) => {
  const { id, createdAt, ...rest } = message
  return rest
}

/**
 * @description The default data
 */
const defaultData: Data = {
  messages: [],
  summary: '',
}

/**
 * @description Get the database
 * @returns The database
 */
export const getDb = async () => {
  const db = await JSONFilePreset<Data>('db.json', defaultData)
  return db
}

/**
 * @description Add messages to the database
 * @param messages - The messages to add
 */
export const addMessages = async (messages: AIMessage[]) => {
  const db = await getDb()
  db.data.messages.push(...messages.map(addMetadata))

  if (db.data.messages.length >= 5) {
    // Get the latest 5 messages and remove the metadata
    const latestMessages = db.data.messages.slice(-5).map(removeMetadata);

    // Summarize the latest 5 messages
    const summary = await summarizeMessages(latestMessages);

    // Update the summary
    db.data.summary = summary;
  }
  // Write the database
  await db.write()
}

/**
 * @description Get the last 5 messages
 * @returns The last 5 messages
 */
export const getMessages = async () => {
  // Get the database
  const db = await getDb()
  // Get the messages and remove the metadata
  const messages = db.data.messages.map(removeMetadata)
  // Get the last 5 messages
  const lastFive = messages.slice(-5)

  // If first message is a tool response, get one more message before it
  if (lastFive[0]?.role === 'tool') {
    // Get the sixth message
    const sixthMessage = messages[messages.length - 6]
    // If the sixth message exists, return it and the last 5 messages
    if (sixthMessage) {
      // Return the sixth message and the last 5 messages
      return [sixthMessage, ...lastFive]
    }
  }

  return lastFive
}

/**
 * @description Save the tool response
 * @param toolCallId - The tool call id
 * @param toolResponse - The tool response
 * @returns The tool response
 */
export const saveToolResponse = async (
  toolCallId: string,
  toolResponse: string
) => {
  return addMessages([
    {
      role: 'tool',
      content: toolResponse,
      tool_call_id: toolCallId,
    },
  ])
}

/**
 * @description Get the summary of the messages
 * @returns The summary of the messages
 */
export const getSummary = async () => {
  const db = await getDb()
  return db.data.summary
}
