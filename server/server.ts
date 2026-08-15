import { createServer } from "node:http";
import { Server } from "socket.io";
import { chatStore } from "./chatStore";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

type Player = {
  id: string;
  x: number;
  y: number;
};

const players = new Map<string, Player>();

io.on("connection", (socket) => {
  console.log("🟢 Jogador entrou:", socket.id);

  const player: Player = {
    id: socket.id,
    x: 1200,
    y: 800
  };

  players.set(socket.id, player);

  // Envia todos os jogadores para quem acabou de entrar
  socket.emit(
    "currentPlayers",
    Array.from(players.values())
  );

  // Avisa os outros
  socket.broadcast.emit(
    "playerJoined",
    player
  );

  socket.on(
    "playerMove",
    (position: { x: number; y: number }) => {
      const current = players.get(socket.id);

      if (!current) return;

      current.x = position.x;
      current.y = position.y;

      socket.broadcast.emit(
        "playerMoved",
        {
          id: socket.id,
          x: current.x,
          y: current.y
        }
      );
    }
  );

  socket.on("disconnect", () => {
    console.log("🔴 Jogador saiu:", socket.id);

    players.delete(socket.id);

    socket.broadcast.emit(
      "playerLeft",
      socket.id
    );
  });

  // Chat message handling
  socket.on("chatMessage", (payload: { text: string; playerName?: string }) => {
    try {
      const text = String(payload?.text || "").slice(0, 1000);
      if (!text.trim()) return;

      const saved = chatStore.saveMessage({
        playerId: socket.id,
        playerName: payload?.playerName,
        text
      });

      io.emit("chatMessage", saved);
    } catch (err) {
      console.error("chatMessage error:", err);
    }
  });

  // Send recent history on connect
  try {
    const recent = chatStore.getMessages();
    socket.emit("chatHistory", recent);
  } catch (err) {
    console.error("failed to load chat history", err);
  }
});

const PORT = Number(process.env.PORT) || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Simple HTTP endpoint for fetching chat messages (used by clients for sync)
httpServer.on("request", (req, res) => {
  try {
    const url = new URL(req.url || "", `http://localhost`);

    if (req.method === "GET" && url.pathname === "/chat") {
      const sinceParam = url.searchParams.get("since");
      const since = sinceParam ? Number(sinceParam) : undefined;
      const messages = chatStore.getMessages(since);

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(messages));
      return;
    }

    // default 404 for other requests
    res.statusCode = 404;
    res.end("Not found");
  } catch (err) {
    res.statusCode = 500;
    res.end(String(err));
  }
});