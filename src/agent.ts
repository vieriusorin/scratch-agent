import { addMessages, getMessages, saveToolResponse } from './memory'
import { runApprovalCheck, runLLM } from './llm'
import { showLoader, logMessage } from './ui'
import { runTool } from './toolRunner'
import type { AIMessage } from './types'
import { calendarEventToolDefinition } from './tools/createCalendarEvent'
import { redditToolDefinition } from './tools/reddit'

/**
 * @description Handle the image approval check
 * @param history - The history of messages
 * @param userMessage - The user's message
 * @returns The agent's response
 */
// 1. First, modify the handleApprovalCheck function to be more explicit
const handleApprovalCheck = async (history: AIMessage[], userMessage: string) => {
  // Get the last AI message (not the last message overall)
  const lastAIMessage = history.filter(msg => msg.role === 'assistant').pop();
  
  // If no AI message or no tool calls, return false (no approval needed)
  if (!lastAIMessage?.tool_calls) {
    return false;
  }
  
  // Get the reddit tool call if it exists
  const redditToolCall = lastAIMessage.tool_calls.find(
    call => call.function.name === redditToolDefinition.name
  );
  
  // If no reddit tool call, return false (no approval needed)
  if (!redditToolCall) {
    return false;
  }
  
  // Parse the arguments to show the user what they're approving
  const args = JSON.parse(redditToolCall.function.arguments);
  
  // Run approval check with explicit instructions
  const loader = showLoader('Processing approval check...');
  loader.update(`Checking approval...`);
  const approved = await runApprovalCheck(userMessage, args);
 
  if (approved) {
    loader.update(`Creating reddit post: ${args.title || 'Reddit Post'}`);
    const toolResponse = await runTool(redditToolCall, userMessage);
    loader.update(`Reddit post created`);
    await saveToolResponse(redditToolCall.id, toolResponse);
  } else {
    // User did not approve, save response
    await saveToolResponse(redditToolCall.id, 
      'User did not explicitly approve the reddit post creation');
  }
  
  loader.stop();
  return true;
}

/**
 * @description Run the agent
 * @param userMessage - The user's message
 * @param tools - The tools to use
 * @returns The agent's response
 */
export const runAgent = async ({
  userMessage,
  tools,
}: {
  userMessage: string
  tools: any[]
}) => {
  // Get the history of messages
  const history = await getMessages();
  // Handle the approval check
  const isApproved = await handleApprovalCheck(history, userMessage);

  if (!isApproved) {
    await addMessages([{ role: 'user', content: userMessage }])
  }

  // Add the user's message to the history
  await addMessages([{ role: 'user', content: userMessage }])

  const loader = showLoader('🤔')

  while (true) {
    // Get the history of messages
    const history = await getMessages()

    // Run the LLM
    const response = await runLLM({ messages: history, tools })
    
    // Add the LLM's response to the history
    await addMessages([response])

    // If the LLM's response is a tool call, run the tool
    if (response.content) {
      logMessage(response)
      loader.stop()
      return getMessages()
    }
    
    // If the LLM's response is a tool call, run the tool
    if (response.tool_calls) {
      // Get the first tool call
      const toolCall = response.tool_calls[0]

      // Log the tool call
      logMessage(response)

      // Update the loader
      loader.update(`executing: ${toolCall.function.name}`)

      // If the tool call needs approval, wait for approval
      if (toolCall.function.name === redditToolDefinition.name) {
        // Update the loader
        loader.update(`waiting for approval...`);
        // Stop the loader
        loader.stop();

        console.log('To continue, please approve the reddit post: (APROVE/DENY) ');
        // Return the history
        return getMessages();
      }

      // Tool response
      const toolResponse = await runTool(toolCall, userMessage)
      // Save the tool response
      await saveToolResponse(toolCall.id, toolResponse)
      // Update the loader
      loader.update(`done: ${toolCall.function.name}`)
    }
  }
}
