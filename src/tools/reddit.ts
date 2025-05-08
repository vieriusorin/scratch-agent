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
    .object({})
    .describe(
      'Use this tool to get the latest posts from Reddit. It will return a JSON object with the title, link, subreddit, author, and upvotes of each post.'
    ),
    description: 'Get a reddit post',
}

export type Args = z.infer<typeof redditToolDefinition.parameters>;

export const getRedditPosts: ToolFn<Args, string> = async ({
    toolArgs,
    userMessage,
  }) => {
    /**
      * INFO: We use the Reddit API to get the posts from the subreddit.
      *  We use the fetch function to get the data from the API.
      *  We use the .json() method to get the data in JSON format.
      *  We use the .map function to get the relevant information.
    */
    const { data } = await fetch('https://www.reddit.com/r/nextjs.json').then((res) =>
      res.json()
    );
  
    /**
     * INFO: Because we have a lot of data, we can use the .map function to get the relevant information
     *  and not to consume to much tokens on the OPEN AI API.
    **/ 
    const relevantInfo = data.children.map((child: any) => ({
      title: child.data.title,
      link: child.data.url,
      subreddit: child.data.subreddit_name_prefixed,
      author: child.data.author,
      upvotes: child.data.ups,
    }))
  
    return JSON.stringify(relevantInfo, null, 2)
  }

getRedditPosts({
    userMessage: 'latest threads on reddit channel nextjs',
    toolArgs: {}
})