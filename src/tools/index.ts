import { generateImageToolDefinition } from "./generateImage";
import { redditToolDefinition } from "./reddit";
import { dadJokeTookDefinition } from "./fileJoke";
import { movieSearchToolDefinition } from "./movieSearch";
import { calendarEventToolDefinition } from "./createCalendarEvent";
import { getCurrentDateToolDefinition } from "./getCurrentDate";

export const tools = [
    generateImageToolDefinition,
    redditToolDefinition,
    dadJokeTookDefinition,
    movieSearchToolDefinition,
    calendarEventToolDefinition,
    getCurrentDateToolDefinition
];

