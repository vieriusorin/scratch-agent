import { z } from 'zod'
import type { ToolFn } from '../types'
import fetch from 'node-fetch'

/**
 * INFO: We define the tool definition.
 *  We use the zod library to define the parameters.
 * The parameters are the input to the tool.
 * The name is the name of the tool.
 * The description is the description of the tool.
 * The fn is the function that will be called when the tool is used.
 */
export const redditToolDefinition = {
  name: 'get_reddit_post',
  parameters: z
    .object({
      subreddit: z.string().describe('The name of the subreddit, e.g., "nextjs", "reactjs", "worldnews"'),
    })
    .describe(
      'Use this tool to get the latest posts from Reddit. It will return a JSON object with the title, link, subreddit, author, and upvotes of each post.'
    ),
  description: 'Get the latest posts from a specific subreddit',
}

export type Args = z.infer<typeof redditToolDefinition.parameters>;

/** 
 * INFO: We define the function that will be called when the tool is used.
 * We use the try catch block to handle the errors.
 * We return the response as a string.
 * 
 * @param toolArgs
 * @returns a list of posts from the subreddit
 */
export const getRedditPosts: ToolFn<Args, string> = async ({ toolArgs }) => {
  try {
    // Validate the subreddit name (basic validation)
    if (!toolArgs.subreddit || toolArgs.subreddit.trim() === '') {
      throw new Error('Subreddit name cannot be empty');
    }

    // Sanitize the subreddit name to prevent injection attacks
    const sanitizedSubreddit = toolArgs.subreddit.trim().replace(/[^a-zA-Z0-9_-]/g, '');

    // Make the API request with error handling
    let response;
    try {
      response = await fetch(`https://www.reddit.com/r/${sanitizedSubreddit}.json`);
    } catch (networkError) {
      throw new Error(`Network error while fetching from Reddit: ${networkError instanceof Error ? networkError.message : 'Unknown error'}`);
    }

    /**
     * INFO: We check if the response is ok.
     * If not, we throw an error.
     * Error code:
     * 404: Subreddit was not found
     * 429: Rate limit exceeded
     * 500: Reddit server error
     */
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Subreddit 'r/${sanitizedSubreddit}' was not found`);
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Reddit API is temporarily unavailable');
      } else if (response.status >= 500) {
        throw new Error(`Reddit server error (${response.status}): ${response.statusText}`);
      } else {
        throw new Error(`Reddit API error (${response.status}): ${response.statusText}`);
      }
    }

    // Parse the JSON with error handling
    let json;
    try {
      json = await response.json();
    } catch (parseError) {
      throw new Error(`Error parsing Reddit response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Validate the response structure
    if (!json.data || !json.data.children || !Array.isArray(json.data.children)) {
      throw new Error('Unexpected response format from Reddit API');
    }

    // Check if we have any posts
    if (json.data.children.length === 0) {
      return JSON.stringify({
        message: `No posts found in r/${sanitizedSubreddit}`,
        posts: []
      }, null, 2);
    }

    // Extract the relevant information with error handling
    try {
      const relevantInfo = json.data.children.slice(0, 5).map((child: any) => {
        // Check for required fields in each post
        if (!child.data) {
          throw new Error('Missing data in post');
        }

        return {
          title: child.data.title || 'No title',
          link: child.data.url || 'No URL',
          subreddit: child.data.subreddit_name_prefixed || `r/${sanitizedSubreddit}`,
          author: child.data.author || 'Unknown author',
          upvotes: child.data.ups !== undefined ? child.data.ups : 0,
        };
      });

      return JSON.stringify({
        message: `Successfully retrieved posts from r/${sanitizedSubreddit}`,
        posts: relevantInfo
      }, null, 2);

    } catch (mappingError) {
      throw new Error(`Error processing Reddit posts: ${mappingError instanceof Error ? mappingError.message : 'Unknown error'}`);
    }
  } catch (error) {
    // Final error handler - all errors will end up here
    return JSON.stringify({
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      posts: []
    }, null, 2);
  }
}