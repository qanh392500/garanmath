import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Replicate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const dbPath = path.resolve(__dirname, 'garanmath.db');

// sqlite3 is a CommonJS module, so we might need to handle the import carefully.
// Usually 'import sqlite3 from "sqlite3"' gives us the module object.
const verboseSqlite = sqlite3.verbose();

const db = new verboseSqlite.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    gemini_api_key TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
        if (err) {
            console.error("Error creating users table:", err.message);
        } else {
            console.log("Users table ready.");

            // Migration: Add gemini_api_key if it doesn't exist
            db.run(`ALTER TABLE users ADD COLUMN gemini_api_key TEXT`, (err) => {
                if (err && !err.message.includes("duplicate column name")) {
                    console.error("Error adding gemini_api_key column:", err.message);
                }
            });

            // Migration: Add role if it doesn't exist
            db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
                if (err && !err.message.includes("duplicate column name")) {
                    console.error("Error adding role column:", err.message);
                } else if (!err) {
                    console.log("Added role column to users table.");
                }
            });

            // Migration: Add last_login
            db.run(`ALTER TABLE users ADD COLUMN last_login DATETIME`, (err) => {
                if (err && !err.message.includes("duplicate column name")) console.error("Error adding last_login:", err.message);
            });

            // Migration: Add ip_address
            db.run(`ALTER TABLE users ADD COLUMN ip_address TEXT`, (err) => {
                if (err && !err.message.includes("duplicate column name")) console.error("Error adding ip_address:", err.message);
            });

            // Migration: Add request_count
            db.run(`ALTER TABLE users ADD COLUMN request_count INTEGER DEFAULT 0`, (err) => {
                if (err && !err.message.includes("duplicate column name")) console.error("Error adding request_count:", err.message);
            });

            // Migration: Add key_name
            db.run(`ALTER TABLE users ADD COLUMN key_name TEXT`, (err) => {
                if (err && !err.message.includes("duplicate column name")) console.error("Error adding key_name:", err.message);
            });
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS knowledge_vectors (
        cmd TEXT PRIMARY KEY,
        desc TEXT,
        ex TEXT,
        embedding TEXT
    )`, (err) => {
        if (err) {
            console.error("Error creating knowledge_vectors table:", err.message);
        } else {
            console.log("Knowledge Vectors table ready.");
        }
    });
});

export default db;
