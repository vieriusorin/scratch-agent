import {  saveToolResponse } from '../memory'
import { runApprovalCheck } from '../llm'
import { showLoader } from '../ui'
import { runTool } from '../toolRunner'
import type { AIMessage } from '../types'
import { redditToolDefinition } from '../tools/reddit'

/**
 * @description Handle the image approval check
 * @param history - The history of messages
 * @param userMessage - The user's message
 * @returns The agent's response
 */
export const handleApprovalCheck = async (history: AIMessage[], userMessage: string) => {
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