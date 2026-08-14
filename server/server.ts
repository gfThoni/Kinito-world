import { createServer } from "node:http";
import { Server } from "socket.io";

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
});

const PORT = Number(process.env.PORT) || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});