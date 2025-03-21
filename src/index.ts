#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { dbOperations } from './database.js';

// Create a new MCP server
const server = new McpServer({
  name: 'TODO',
  version: '1.0.0',
});

// Add tool for adding todos
server.tool(
  'add-todo',
  {
    text: z.string(),
  },
  async ({ text }) => {
    try {
      const todo = dbOperations.addTodo(text);
      return {
        content: [
          {
            type: 'text',
            text: `Todo added: ${text} with ID ${todo.id}.`,
          },
        ],
      };
    } catch (error) {
      console.error('Error adding todo:', error);
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to add todo. Please try again later.',
          },
        ],
      };
    }
  },
);

// Add tool for listing todos
server.tool(
  'get-todo',
  {}, // Empty schema but properly defined
  async () => {
    try {
      const todos: { id: number; text: string }[] = dbOperations.getTodos();

      if (todos.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'You have no todo items yet.',
            },
          ],
        };
      }

      const todoList = todos
        .map((todo: { id: number; text: string }) => `${todo.id}: ${todo.text}`)
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `You have ${todos.length} todo items:\n${todoList}`,
          },
        ],
      };
    } catch (error) {
      console.error('Error retrieving todos:', error);
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to retrieve todos. Please try again later.',
          },
        ],
      };
    }
  },
);

// Add tool for removing todos
server.tool('remove-todo', { id: z.number() }, async ({ id }) => {
  try {
    const removed = dbOperations.removeTodo(id);

    if (!removed) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: No todo item found with ID ${id}.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Todo ${id} removed.`,
        },
      ],
    };
  } catch (error) {
    console.error('Error removing todo:', error);
    return {
      content: [
        {
          type: 'text',
          text: 'Failed to remove todo. Please try again later.',
        },
      ],
    };
  }
});

// Add tool for editing todos
server.tool(
  'edit-todo',
  {
    id: z.number(),
    newText: z.string(),
  },
  async ({ id, newText }) => {
    try {
      const updated = dbOperations.editTodo(id, newText);
      if (!updated) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: No todo item found with ID ${id} to update.`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: `Todo ${id} updated to: ${newText}.`,
          },
        ],
      };
    } catch (error) {
      console.error('Error editing todo:', error);
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to update todo. Please try again later.',
          },
        ],
      };
    }
  },
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
    console.log('Server started successfully.');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
