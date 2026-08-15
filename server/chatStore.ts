import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const jsonPath = path.join(dbDir, "chat.json");

type ChatMessage = {
  id: number;
  playerId: string;
  playerName?: string | null;
  text: string;
  ts: number;
};

function readAll(): ChatMessage[] {
  try {
    if (!fs.existsSync(jsonPath)) return [] as any[];
    const raw = fs.readFileSync(jsonPath, "utf-8");
    return JSON.parse(raw || "[]") as ChatMessage[];
  } catch (err) {
    console.error("Failed reading chat.json", err);
    return [] as ChatMessage[];
  }
}

function writeAll(rows: ChatMessage[]) {
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed writing chat.json", err);
  }
}

let messages: ChatMessage[] = readAll();
let nextId = messages.length > 0 ? Math.max(...messages.map((m: ChatMessage) => m.id)) + 1 : 1;

export const chatStore = {
  saveMessage(payload: { playerId: string; playerName?: string | null; text: string }): ChatMessage {
    const ts = Date.now();
    const msg = {
      id: nextId++,
      playerId: payload.playerId,
      playerName: payload.playerName || `Player-${payload.playerId.slice(0,5)}`,
      text: payload.text,
      ts
    };

    messages.push(msg);
    // keep last 5000 messages
    if (messages.length > 5000) messages = messages.slice(-5000);
    writeAll(messages);
    return msg;
  },

  getMessages(since?: number): ChatMessage[] {
    if (since) {
      return messages.filter((m: ChatMessage) => m.ts > since).slice(-500);
    }
    return messages.slice(-200);
  }
};
