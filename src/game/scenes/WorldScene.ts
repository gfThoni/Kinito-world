import Phaser from "phaser";
import { gameState } from "../GameState";
import { io, Socket } from "socket.io-client";

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private target!: Phaser.Math.Vector2;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private minimap!: Phaser.GameObjects.Graphics;
  private minimapPlayer!: Phaser.GameObjects.Rectangle;

  private dialogue!: Phaser.GameObjects.Text;
  private inventoryText!: Phaser.GameObjects.Text;

  private npcs: Phaser.GameObjects.Rectangle[] = [];
  private items: Phaser.GameObjects.Arc[] = [];

  private socket!: Socket;

  constructor() {
    super("WorldScene");
  }

  create() {
    this.createWorld();
    this.createPlayer();
    this.createNPCs();
    this.createItems();
    this.createHUD();
    this.createMinimap();
    this.socket = io("https://kinito-world.onrender.com");

    this.target = new Phaser.Math.Vector2(
      this.player.x,
      this.player.y
    );

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys(
    "W,S,A,D"
    ) as Record<string, Phaser.Input.Keyboard.Key>;


    this.input.on(
      "pointerdown",
      (pointer: Phaser.Input.Pointer) => {
        const clickedNPC = this.findNPC(
          pointer.worldX,
          pointer.worldY
        );

        if (clickedNPC) {
          this.talkToNPC(clickedNPC);
          return;
        }

        const clickedItem = this.findItem(
          pointer.worldX,
          pointer.worldY
        );

        if (clickedItem) {
          this.collectItem(clickedItem);
          return;
        }

        // Apenas anda. Não mostra mensagem.
        this.target.set(
          pointer.worldX,
          pointer.worldY
        );
      }
    );

    this.cameras.main.startFollow(this.player);

    this.cameras.main.setBounds(
      0,
      0,
      2400,
      1600
    );
  }

  update(
    _time: number,
    delta: number
  ) {
    const distance =
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.target.x,
        this.target.y
      );

    if (distance > 5) {
      const angle =
        Phaser.Math.Angle.Between(
          this.player.x,
          this.player.y,
          this.target.x,
          this.target.y
        );

      const speed = 220;

      this.player.x +=
        Math.cos(angle) *
        speed *
        delta /
        1000;

      this.player.y +=
        Math.sin(angle) *
        speed *
        delta /
        1000;
    }

    this.checkItems();
    this.checkNPCs();
    this.updateMinimap();
  }

  private updateMinimap() {
  const mapX = 790 + (this.player.x / 2400) * 180;
  const mapY = 30 + (this.player.y / 1600) * 110;

  this.minimapPlayer.setPosition(
    mapX,
    mapY
  );
}

private createWorld() {
  // 🌱 Fundo do mundo
  this.add.rectangle(
    1200,
    800,
    2400,
    1600,
    0x69b85f
  );

  // 🛣️ Estrada principal horizontal
  this.add.rectangle(
    1200,
    800,
    2400,
    180,
    0x777777
  );

  // 🛣️ Estrada principal vertical
  this.add.rectangle(
    1200,
    800,
    180,
    1600,
    0x777777
  );

  // 🟨 Faixas da estrada horizontal
  for (let x = 40; x < 2360; x += 100) {
    this.add.rectangle(
      x,
      800,
      55,
      8,
      0xf5d547
    );
  }

  // 🟨 Faixas da estrada vertical
  for (let y = 40; y < 1560; y += 100) {
    this.add.rectangle(
      1200,
      y,
      8,
      55,
      0xf5d547
    );
  }




  // 🌊 Lago
  this.add.ellipse(
    1800,
    300,
    520,
    320,
    0x3498db
  );

  // Pequenas ondas no lago
  for (let i = 0; i < 8; i++) {
    const x = 1600 + i * 55;
    const y = 250 + (i % 3) * 55;

    this.add.ellipse(
      x,
      y,
      45,
      12,
      0x6fc5ed
    );
  }

  // 🌲 Floresta superior esquerda
  this.createForest(
    80,
    80,
    650,
    550
  );

  // 🌲 Floresta inferior direita
  this.createForest(
    1650,
    1050,
    600,
    450
  );

  // 🌳 Parque inferior esquerdo
  this.add.rectangle(
    450,
    1150,
    600,
    350,
    0x78c96b
  );

  // Árvores do parque
  const parkTrees = [
    [220, 1050],
    [400, 1050],
    [580, 1050],
    [760, 1050],

    [220, 1250],
    [400, 1250],
    [580, 1250],
    [760, 1250],

    [400, 1400],
    [580, 1400]
  ];

  for (const [x, y] of parkTrees) {
    this.createTree(x, y);
  }

  // 🌼 Flores no parque
  for (let i = 0; i < 25; i++) {
    const x = Phaser.Math.Between(180, 850);
    const y = Phaser.Math.Between(1050, 1450);

    this.add.circle(
      x,
      y,
      4,
      i % 2 === 0
        ? 0xff79aa
        : 0xffff66
    );
  }

  // 🌿 Pequenas áreas de vegetação
  for (let i = 0; i < 30; i++) {
    const x = Phaser.Math.Between(50, 2350);
    const y = Phaser.Math.Between(50, 1550);

    // Evita colocar vegetação em cima da estrada
    if (
      Math.abs(x - 1200) < 120 ||
      Math.abs(y - 800) < 120
    ) {
      continue;
    }

    this.add.circle(
      x,
      y,
      Phaser.Math.Between(4, 9),
      0x4d9f48
    );
  }

  // 🟩 Limites visuais do mundo
  this.add.rectangle(
    1200,
    10,
    2400,
    20,
    0x367a38
  );

  this.add.rectangle(
    1200,
    1590,
    2400,
    20,
    0x367a38
  );

  this.add.rectangle(
    10,
    800,
    20,
    1600,
    0x367a38
  );

  this.add.rectangle(
    2390,
    800,
    20,
    1600,
    0x367a38
  );
}

  private createPlayer() {
    this.player = this.add.rectangle(
      1200,
      800,
      35,
      45,
      0x2874ff
    );

    this.player.setDepth(10);
  }

  private createNPCs() {
    this.createNPC(
      800,
      700,
      0xffcc00,
      "Augusto",
      "Olá! Eu sou o Augusto!"
    );

    this.createNPC(
      1050,
      900,
      0xff66aa,
      "Haline",
      "Você viu a moeda na floresta?"
    );

    this.createNPC(
      1450,
      800,
      0x9b59b6,
      "???",
      "???"
    );
  }

  private createNPC(
    x: number,
    y: number,
    color: number,
    name: string,
    text: string
  ) {
    const npc = this.add.rectangle(
      x,
      y,
      35,
      45,
      color
    );

    npc.setData("name", name);
    npc.setData("text", text);

    this.npcs.push(npc);

    this.add.text(
      x - 30,
      y - 60,
      name,
      {
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#222222",
        padding: {
          x: 5,
          y: 5
        }
      }
    );
  }

  private createItems() {
    this.createItem(
      600,
      600,
      0xffd700,
      "Moeda"
    );

    this.createItem(
      900,
      500,
      0x8b4513,
      "Chave"
    );

    this.createItem(
      1600,
      1000,
      0x00ffff,
      "Cristal"
    );
  }

  private createItem(
    x: number,
    y: number,
    color: number,
    name: string
  ) {
    const item = this.add.circle(
      x,
      y,
      14,
      color
    );

    item.setData("name", name);

    this.items.push(item);

    this.add.text(
      x - 25,
      y + 20,
      name,
      {
        fontSize: "14px",
        color: "#ffffff"
      }
    );
  }

  private findNPC(
    x: number,
    y: number
  ) {
    return this.npcs.find(
      npc =>
        Phaser.Math.Distance.Between(
          x,
          y,
          npc.x,
          npc.y
        ) < 50
    );
  }

  private findItem(
    x: number,
    y: number
  ) {
    return this.items.find(
      item =>
        Phaser.Math.Distance.Between(
          x,
          y,
          item.x,
          item.y
        ) < 40
    );
  }

  private talkToNPC(
    npc: Phaser.GameObjects.Rectangle
  ) {
    const name = npc.getData("name");
    const text = npc.getData("text");

    this.dialogue.setText(
      `💬 ${name}: ${text}`
    );
  }

  private collectItem(
    item: Phaser.GameObjects.Arc
  ) {
    const name = item.getData("name");

    gameState.addItem(name);

    item.destroy();

    this.dialogue.setText(
      `✨ Você pegou: ${name}!`
    );

    this.updateInventory();

    this.items = this.items.filter(
      current => current !== item
    );
  }

  private checkItems() {
    for (const item of [...this.items]) {
      const distance =
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          item.x,
          item.y
        );

      if (distance < 35) {
        this.collectItem(item);
      }
    }
  }

  private checkNPCs() {
    for (const npc of this.npcs) {
      const distance =
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          npc.x,
          npc.y
        );

      if (distance < 70) {
        this.dialogue.setText(
          `👤 ${npc.getData("name")} está perto. Clique nele!`
        );

        return;
      }
    }
  }

  private createHUD() {
    this.inventoryText = this.add.text(
      20,
      20,
      "",
      {
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#222222",
        padding: {
          x: 10,
          y: 8
        }
      }
    );

    this.inventoryText.setScrollFactor(0);

    this.dialogue = this.add.text(
      20,
      470,
      "🖱️ Clique no chão para andar",
      {
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#222222",
        padding: {
          x: 10,
          y: 8
        }
      }
    );

    this.dialogue.setScrollFactor(0);

    this.updateInventory();
  }

  private updateInventory() {
    const items =
      gameState.inventory.length > 0
        ? gameState.inventory.join(", ")
        : "vazio";

    this.inventoryText.setText(
      `🎒 Inventário: ${items}`
    );
  }
  private createTree(x: number, y: number) {
  this.add.circle(
    x,
    y,
    30,
    0x176b2c
  );

  this.add.rectangle(
    x,
    y + 35,
    12,
    45,
    0x754c24
  );
}

private createForest(
  startX: number,
  startY: number,
  width: number,
  height: number
) {
  for (let i = 0; i < 22; i++) {
    const x = Phaser.Math.Between(
      startX,
      startX + width
    );

    const y = Phaser.Math.Between(
      startY,
      startY + height
    );

    this.createTree(x, y);
  }
}

private createHouse(x: number, y: number) {
  this.add.rectangle(
    x,
    y,
    120,
    80,
    0xf0d19a
  );

  this.add.triangle(
    x,
    y - 55,
    0,
    55,
    120,
    55,
    60,
    0,
    0xb94b4b
  );

  this.add.rectangle(
    x,
    y + 18,
    24,
    38,
    0x754c24
  );

  this.add.rectangle(
    x - 38,
    y - 8,
    25,
    22,
    0x6ec6e8
  );

  this.add.rectangle(
    x + 38,
    y - 8,
    25,
    22,
    0x6ec6e8
  );
}
private createMinimap() {
  // 📍 Fundo do mini-mapa
  this.minimap = this.add.graphics();

  this.minimap.fillStyle(0x222222, 0.85);
  this.minimap.fillRect(
    780,
    20,
    200,
    130
  );

  // 🌱 mapa
  this.minimap.fillStyle(0x69b85f, 1);
  this.minimap.fillRect(
    790,
    30,
    180,
    110
  );

  // 🛣️ estrada horizontal
  this.minimap.fillStyle(0x777777, 1);
  this.minimap.fillRect(
    790,
    82,
    180,
    12
  );

  // 🛣️ estrada vertical
  this.minimap.fillRect(
    874,
    30,
    12,
    110
  );

  // 🌊 lago
  this.minimap.fillStyle(0x3498db, 1);
  this.minimap.fillEllipse(
    925,
    55,
    40,
    25
  );

  // 🌲 floresta
  this.minimap.fillStyle(0x176b2c, 1);

  for (let i = 0; i < 12; i++) {
    const x = 805 + (i % 4) * 18;
    const y = 45 + Math.floor(i / 4) * 15;

    this.minimap.fillCircle(
      x,
      y,
      5
    );
  }

  // 🌲 floresta inferior direita
  for (let i = 0; i < 10; i++) {
    const x = 920 + (i % 5) * 9;
    const y = 115 + Math.floor(i / 5) * 12;

    this.minimap.fillCircle(
      x,
      y,
      5
    );
  }

  // 🔵 jogador
  this.minimapPlayer = this.add.rectangle(
    880,
    85,
    6,
    6,
    0x2874ff
  );

  // IMPORTANTE:
  // o mini-mapa fica preso à tela
  this.minimap.setScrollFactor(0);
  this.minimapPlayer.setScrollFactor(0);

  this.minimap.setDepth(100);
  this.minimapPlayer.setDepth(101);
}
}