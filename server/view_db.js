import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'garanmath.db');

const verboseSqlite = sqlite3.verbose();
const db = new verboseSqlite.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

console.log(`📂 Database: ${dbPath}\n`);

db.serialize(() => {
    // 1. Check Users
    db.all("SELECT id, name, email, created_at FROM users", (err, rows) => {
        if (err) {
            console.error("❌ Error reading users:", err.message);
        } else {
            console.log(`👤 Users (${rows.length}):`);
            if (rows.length > 0) {
                console.table(rows);
            } else {
                console.log("   (No users found)");
            }
            console.log("-".repeat(50));
        }
    });

    // 2. Check Knowledge Vectors (Commands)
    db.all("SELECT cmd, desc, ex FROM knowledge_vectors", (err, rows) => {
        if (err) {
            console.error("❌ Error reading knowledge_vectors:", err.message);
        } else {
            console.log(`📚 Knowledge Vectors (${rows.length} commands):`);
            if (rows.length > 0) {
                // Show only first 10 to avoid spamming console, or all if user wants
                const preview = rows.map(r => ({ Command: r.cmd, Description: r.desc.substring(0, 50) + "..." }));
                console.table(preview);
            } else {
                console.log("   (No commands found)");
            }
        }
    });
});
