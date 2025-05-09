import type { ToolFn } from "../types";
import { queryMovies } from "../rag/query";
import { z } from "zod";

/**
 * The tool definition for the movie search tool
 * The tool is used to search for movies and information about them
 * The tool is used to answer questions about movies
 */
export const movieSearchToolDefinition = {
    name: 'movieSearch',
    parameters: z.object({
      query: z.string().describe('The search query for finding movies'),
      genre: z.string().optional().describe('Filter movies by genre'),
      director: z.string().optional().describe('Filter movies by director'),
    }),
    description:
      'Searches for movies and information about them, including title, year, genre, director, actors, rating, and description. Use this to answer questions about movies.',
  };

type Args = z.infer<typeof movieSearchToolDefinition.parameters>;

/**
 * The tool function for the movie search tool
 * The tool is used to search for movies and information about them
 * The tool is used to answer questions about movies
 * @param userMessage - The user message
 * @param toolArgs - The tool arguments
 * @returns The results of the movie search
 */
export const getMovieSearchTool: ToolFn<Args> = async ({ userMessage, toolArgs }) => {
    let results;
    try {
        results = await queryMovies({query: toolArgs.query});
    } catch (e) {
        console.error(e);
        return 'Error: Could not query the db for movies';
    }
    const formattedResults = results.map((result) => {
        const { metadata, data } = result;
        
        return {
            ...metadata,
            description: data,
        }
    })

    return JSON.stringify(formattedResults);
}



