# Simple AI Message Memory

This module provides a simple mechanism for storing and retrieving AI message history using a local JSON file (`db.json`). It leverages the `lowdb` library for file-based database operations and `uuid` for generating unique message identifiers.

## Features

*   **Persistent Storage:** Saves message history to a `db.json` file.
*   **Metadata:** Automatically adds a unique `id` and `createdAt` timestamp to each message upon saving.
*   **Clean Retrieval:** Removes internal metadata (`id`, `createdAt`) when retrieving messages, returning them in their original `AIMessage` format.
*   **Batch Operations:** Allows adding multiple messages at once.
*   **Tool Response Helper:** Includes a specific function (`saveToolResponse`) for easily saving responses from tool calls.

## Core Functions

*   `addMessages(messages: AIMessage[])`: Adds an array of `AIMessage` objects to the history. Metadata is added automatically.
*   `getMessages()`: Retrieves all messages from the history, stripping the metadata before returning.
*   `saveToolResponse(toolCallId: string, toolResponse: string)`: A convenience function to add a message with `role: 'tool'`.

## Dependencies

*   [lowdb](https://github.com/typicode/lowdb): For interacting with the JSON database file.
*   [uuid](https://github.com/uuidjs/uuid): For generating unique IDs for messages.

## Data Storage

The message history is stored in a file named `db.json` in the same directory where the script is run. The structure within the file is:
