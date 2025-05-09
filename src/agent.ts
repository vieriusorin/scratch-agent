import { addMessages, getMessages, saveToolResponse } from './memory'
import { runLLM } from './llm'
import { showLoader, logMessage } from './ui'
import { runTool } from './toolRunner'
import { redditToolDefinition } from './tools/reddit'
import { detectSuspiciousPatterns, sanitizeUserInput } from './utils/inputSanitizer'
import { handleApprovalCheck } from './utils/handleApprovalCheck'
import { 
  analyzeContextShift, 
  initializeConversationContext, 
  incrementInjectionAttempts,
  getConversationContext 
} from './utils/conversationContext'
import { logErrorToService } from './utils/errorLogging'

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
  // Sanitize user input before processing
  const sanitizedMessage = sanitizeUserInput(userMessage);

  // Get the message history
  const history = await getMessages();
  
  // Initialize conversation context if this is first run
  if (history.length > 0 && getConversationContext().mainTopics.length === 0) {
    await initializeConversationContext(history);
  }
  
  // First check for basic suspicious patterns
  const isPatternSuspicious = detectSuspiciousPatterns(userMessage);
  
  if (isPatternSuspicious) {
    // Log suspicious input for review
    console.warn('Suspicious pattern detected:', userMessage);
    logErrorToService({
      toolName: 'inputSanitizer',
      error: 'Suspicious pattern detected in user input',
      timestamp: new Date().toISOString()
    });
    return { 
      blocked: true, 
      reason: 'Your message contains patterns that may be unsafe. Please rephrase your request.' 
    };
  }
  
  // Then check for context-based suspicious shifts
  const contextAnalysis = await analyzeContextShift(sanitizedMessage, history);
  
  if (contextAnalysis.isInjectionAttempt && contextAnalysis.confidence > 0.7) {
    // High confidence this is an injection attempt
    console.warn('Context-based injection attempt detected:', userMessage);
    console.warn('Reasoning:', contextAnalysis.reasoning);
    
    // Log the attempt
    logErrorToService({
      toolName: 'conversationContext',
      error: 'Context-based injection attempt detected',
      stack: JSON.stringify({
        message: sanitizedMessage,
        confidence: contextAnalysis.confidence,
        reasoning: contextAnalysis.reasoning
      }),
      timestamp: new Date().toISOString()
    });
    
    // Increment the count of potential injection attempts
    incrementInjectionAttempts();
    
    return { 
      blocked: true, 
      reason: 'Your message appears to be an abrupt topic change that might be unsafe. Please continue the current conversation naturally.' 
    };
  } else if (contextAnalysis.isInjectionAttempt && contextAnalysis.confidence > 0.4) {
    // Medium confidence - add a warning but process the message
    console.warn('Potential context shift detected:', userMessage);
    console.warn('Reasoning:', contextAnalysis.reasoning);
    
    // Note the potential attempt but continue
    incrementInjectionAttempts();
  }

  // Handle the approval check
  const isApproved = await handleApprovalCheck(history, sanitizedMessage);

  if (!isApproved) {
    await addMessages([{ role: 'user', content: sanitizedMessage }])
  }

  // Add the user's message to the history
  await addMessages([{ role: 'user', content: sanitizedMessage }])

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

        console.log('To continue, please approve the reddit post: (APPROVE/DENY) ');
        // Return the history
        return getMessages();
      }

      // Tool response
      const toolResponse = await runTool(toolCall, sanitizedMessage)
      // Save the tool response
      await saveToolResponse(toolCall.id, toolResponse)
      // Update the loader
      loader.update(`done: ${toolCall.function.name}`)
    }
  }
}