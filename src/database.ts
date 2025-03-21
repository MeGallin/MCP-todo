import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

// Get the directory where the current module is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a relative path for the database directory
const dataDir = join(dirname(__dirname), 'todos');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'todos.db');

const db = new Database(dbPath);

//Create the todos table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        completedAt DATETIME
    )
`);

//Create a new todo
export const dbOperations = {
  addTodo: (text: string) => {
    const stmt = db.prepare('INSERT INTO todos (text) VALUES (?)');
    const info = stmt.run(text);
    return { id: info.lastInsertRowid as number, text };
  },
  getTodos: (): { id: number; text: string }[] => {
    return db.prepare('SELECT id, text FROM todos ORDER BY id DESC').all() as {
      id: number;
      text: string;
    }[];
  },
  removeTodo: (id: number): boolean => {
    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },
  editTodo: (id: number, newText: string): boolean => {
    const stmt = db.prepare('UPDATE todos SET text = ? WHERE id = ?');
    const info = stmt.run(newText, id);
    return info.changes > 0;
  },
};
