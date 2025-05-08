import { z } from 'zod';
import type { ToolFn } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * @description Tool definition for creating a calendar event with time zone support
 * @param event - The event name
 * @param date - The date of the event
 * @param participants - The participants of the event
 * @param time - The time of the event
 * @param timeZone - The time zone of the event (IANA time zone identifier)
 * @param currentDate - The current date from the system
 * @returns The calendar event
 */
export const calendarEventToolDefinition = {
    name: 'calendar_event',
    parameters: z.object({
        event: z.string().describe('The event name'),
        date: z.string().describe('The date of the event'),
        participants: z.array(z.string()).describe('The participants of the event'),
        time: z.string().describe('The time of the event'),
        timeZone: z.string().describe('The time zone for the event (IANA format like "America/New_York" or "Europe/London")'),
        currentDate: z.string().optional().describe('The current date from the system')
    }),
    description: `Parses user messages for calendar invitations by extracting
        Event name
        Participants
        Date (handles explicit dates and relative terms like 'tomorrow', 'this Friday', 'next weekend', etc.)
        Time (or defaults to all-day if unspecified)
        Time Zone (uses IANA time zone identifiers like "America/New_York" or "Europe/London", defaults to UTC if unspecified)
        Date-resolution rules:
        Use ISO weeks (Monday-to-Sunday).
        "This X" refers to the X in the current week; "next X" refers to the X in the following week.
        Weekend = Saturday & Sunday.
        "This weekend" ⇒ Saturday of the current week.
        "Next weekend" ⇒ Saturday of the following week.
        If no day-of-week is specified and the user just said "(next/this) weekend," default to Sunday of that weekend.
        When detecting time zones, look for explicit mentions ("Pacific Time", "Eastern Time") or location hints ("in Seattle", "New York time").
        Trigger this tool whenever a message implies scheduling (e.g. meetings, parties, trips, deadlines).`,
}

type Args = z.infer<typeof calendarEventToolDefinition.parameters>;

/**
 * @description Tool for creating a calendar event with time zone support and saving it as a JSON file
 * @param toolArgs - The tool arguments
 * @param userMessage - The user message
 * @returns The calendar event and file creation confirmation
 */
export const createCalendarEvent: ToolFn<Args, string> = async ({ toolArgs, userMessage }) => {
    // Handle defaults at runtime instead of in the schema
    const { 
        event, 
        date, 
        participants, 
        time, 
        timeZone, 
        currentDate = new Date().toISOString() 
    } = toolArgs;
    
    // Apply default time zone if not provided or empty
    const effectiveTimeZone = timeZone || 'UTC';
    
    // Format the datetime with time zone information
    let formattedDateTime;
    try {
        // Create safer date handling with fallbacks
        // First, try a direct parsing approach with input validation
        console.log(`Attempting to parse date: "${date}" and time: "${time}"`);
        
        // Normalize date format - this handles many common formats
        let normalizedDate = date;
        let normalizedTime = time;
        
        // Simple date normalization for common formats
        // If date doesn't match YYYY-MM-DD pattern, try to convert it
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            try {
                // Try parsing with Date.parse
                const parsedDate = new Date(date);
                if (!isNaN(parsedDate.getTime())) {
                    // Format as YYYY-MM-DD
                    normalizedDate = parsedDate.toISOString().split('T')[0];
                    console.log(`Normalized date to: ${normalizedDate}`);
                }
            } catch (err) {
                console.error(`Failed to normalize date: ${date}`, err);
            }
        }
        
        // Simple time normalization for common formats
        // If time doesn't match HH:MM format, try to convert it
        if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
            try {
                // Try parsing a placeholder date with this time
                const placeholderDateTime = new Date(`2000-01-01 ${time}`);
                if (!isNaN(placeholderDateTime.getTime())) {
                    normalizedTime = placeholderDateTime.toTimeString().split(' ')[0].substring(0, 5);
                    console.log(`Normalized time to: ${normalizedTime}`);
                }
            } catch (err) {
                console.error(`Failed to normalize time: ${time}`, err);
            }
        }
        
        // Now try to create a JavaScript date object
        // First, with ISO 8601 format
        let eventDate = new Date(`${normalizedDate}T${normalizedTime}`);
        
        // If that fails, try other approaches
        if (isNaN(eventDate.getTime())) {
            // Try with space instead of T
            eventDate = new Date(`${normalizedDate} ${normalizedTime}`);
            
            // If still invalid, use current date as fallback but keep the time if possible
            if (isNaN(eventDate.getTime())) {
                console.log('Using fallback date handling');
                const today = new Date();
                const [hours, minutes] = normalizedTime.split(':').map(Number);
                
                if (!isNaN(hours) && !isNaN(minutes)) {
                    today.setHours(hours, minutes, 0, 0);
                }
                
                eventDate = today;
            }
        }
        
        console.log(`Successfully created Date object: ${eventDate.toString()}`);
        
        // Format the date with time zone information using Intl.DateTimeFormat
        formattedDateTime = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZone: effectiveTimeZone,
            timeZoneName: 'long'
        }).format(eventDate);
        
        console.log(`Formatted datetime: ${formattedDateTime}`);
    } catch (error) {
        console.error('Error formatting date with time zone:', error);
        // Provide a simple fallback that doesn't rely on Date parsing
        formattedDateTime = `${date} at ${time} (${effectiveTimeZone})`;
    }
    
    // Create a unique filename based on event name and timestamp
    const sanitizedEventName = event.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    const filename = `${sanitizedEventName}_${timestamp}.json`;
    
    // Define the directory where events will be stored
    const eventsDir = path.join(process.cwd(), 'events');
    
    // Create the directory if it doesn't exist
    try {
        await fs.mkdir(eventsDir, { recursive: true });
    } catch (error) {
        console.error('Error creating events directory:', error);
    }
    
    // Create the full file path
    const filePath = path.join(eventsDir, filename);
    
    // Create the event object with all relevant information
    const eventObject = {
        event,
        date,
        time,
        timeZone: effectiveTimeZone,
        formattedDateTime,
        participants,
        createdAt: currentDate,
        metadata: {
            source: 'calendar_event_tool',
            userMessage: userMessage,
            creationTimestamp: timestamp
        }
    };
    
    // Convert the event object to JSON and write it to the file
    try {
        await fs.writeFile(filePath, JSON.stringify(eventObject, null, 2));
        console.log(`Event saved to ${filePath}`);
        
        // Return a success message along with the event details
        return `
        Event: ${event}
        Date and Time: ${formattedDateTime}
        Participants: ${participants.join(', ')}
        Time Zone: ${effectiveTimeZone}
        
        ✅ Event has been saved to ${filename}
        `;
    } catch (error) {
        console.error('Error writing event to file:', error);
        
        // Return an error message
        return `
        Event: ${event}
        Date and Time: ${formattedDateTime}
        Participants: ${participants.join(', ')}
        Time Zone: ${effectiveTimeZone}
        
        ❌ Error: Could not save event to file. Please try again.
        `;
    }
}