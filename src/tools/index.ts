import { generateImageToolDefinition } from "./generateImage";
import { redditToolDefinition } from "./reddit";
import { dadJokeToolDefinition } from "./fileJoke";
import { movieSearchToolDefinition } from "./movieSearch";
import { calendarEventToolDefinition } from "./createCalendarEvent";
import { getCurrentDateToolDefinition } from "./getCurrentDate";

export const tools = [
    generateImageToolDefinition,
    redditToolDefinition,
    dadJokeToolDefinition,
    movieSearchToolDefinition,
    calendarEventToolDefinition,
    getCurrentDateToolDefinition
];

