import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "chat.db");
const db = new Database(dbPath);

db.prepare(
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playerId TEXT,
    playerName TEXT,
    text TEXT,
    ts INTEGER
  )`
).run();

export const chatStore = {
  saveMessage(payload: { playerId: string; playerName?: string; text: string }) {
    const ts = Date.now();
    const stmt = db.prepare(
      `INSERT INTO messages (playerId, playerName, text, ts) VALUES (?, ?, ?, ?)`
    );
    const info = stmt.run(payload.playerId, payload.playerName || null, payload.text, ts);
    return {
      id: Number(info.lastInsertRowid),
      playerId: payload.playerId,
      playerName: payload.playerName || `Player-${payload.playerId.slice(0, 5)}`,
      text: payload.text,
      ts
    };
  },

  getMessages(since?: number) {
    if (since) {
      const stmt = db.prepare(
        `SELECT id, playerId, playerName, text, ts FROM messages WHERE ts > ? ORDER BY ts ASC LIMIT 500`
      );
      return stmt.all(since);
    }

    const stmt = db.prepare(
      `SELECT id, playerId, playerName, text, ts FROM messages ORDER BY ts DESC LIMIT 200`
    );
    const rows = stmt.all();
    return rows.reverse();
  }
};
