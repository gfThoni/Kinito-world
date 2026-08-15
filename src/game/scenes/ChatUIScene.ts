import Phaser from "phaser";
import type { Socket } from "socket.io-client";

type ChatMessage = {
  id: number;
  playerId: string;
  playerName?: string;
  text: string;
  ts: number;
};

export class ChatUIScene extends Phaser.Scene {
  private socket?: Socket;
  private container?: HTMLDivElement;
  private messagesDiv?: HTMLDivElement;
  private statusDiv?: HTMLDivElement;
  private playerName?: string | null;

  constructor() {
    super("ChatUIScene");
  }

  init(data: any) {
    this.socket = data?.socket;
  }

  create() {
    this.createDOM();

    if (this.socket) {
      this.socket.on("chatMessage", (msg: ChatMessage) => this.appendMessage(msg));
      this.socket.on("chatHistory", (msgs: ChatMessage[]) => {
        for (const m of msgs) this.appendMessage(m);
      });
      this.socket.on("connect", () => this.setStatus("Conectado"));
      this.socket.on("disconnect", (reason: any) => this.setStatus("Desconectado"));
      this.socket.on("connect_error", (err: any) => {
        console.error("Socket connect_error:", err);
        this.setStatus("Erro de conexão");
      });
      // if name stored, send to server
      const stored = localStorage.getItem("playerName");
      if (stored) {
        this.playerName = stored;
        this.socket.emit("setName", stored);
        this.setStatus(`Conectado como ${stored}`);
      }
    }
  }

  private createDOM() {
    // container
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.right = "20px";
    container.style.bottom = "20px";
    container.style.width = "320px";
    container.style.maxHeight = "40vh";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "8px";
    container.style.zIndex = "9999";

    // messages
    const messages = document.createElement("div");
    messages.style.flex = "1 1 auto";
    messages.style.overflowY = "auto";
    messages.style.background = "rgba(0,0,0,0.6)";
    messages.style.color = "#fff";
    messages.style.padding = "8px";
    messages.style.borderRadius = "6px";
    messages.style.fontFamily = "sans-serif";
    messages.style.fontSize = "13px";

    // input row
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "8px";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Digite uma mensagem...";
    input.style.flex = "1 1 auto";
    input.style.padding = "8px";
    input.style.borderRadius = "6px";
    input.style.border = "1px solid #444";

    const send = document.createElement("button");
    send.textContent = "Enviar";
    send.style.padding = "8px 10px";
    send.style.borderRadius = "6px";
    send.style.border = "none";
    send.style.background = "#2b8aef";
    send.style.color = "#fff";

    send.addEventListener("click", () => {
      const text = input.value.trim();
      if (!text || !this.socket) return;
      this.socket.emit("chatMessage", { text, playerName: this.playerName });
      input.value = "";
    });

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        send.click();
      }
    });

    row.appendChild(input);
    row.appendChild(send);

    // name is provided in menu; ChatUI is only for messages/status

    // status
    const status = document.createElement("div");
    status.style.fontSize = "12px";
    status.style.color = "#ddd";
    status.style.textAlign = "right";
    status.textContent = "Conectando...";

    container.appendChild(messages);
    container.appendChild(status);
    container.appendChild(row);

    document.body.appendChild(container);

    this.container = container;
    this.messagesDiv = messages;
    this.statusDiv = status;
  }

  private appendMessage(msg: ChatMessage) {
    if (!this.messagesDiv) return;
    const el = document.createElement("div");
    const time = new Date(msg.ts || Date.now()).toLocaleTimeString();
    const name = msg.playerName || msg.playerId || "Player";
    el.textContent = `[${time}] ${name}: ${msg.text}`;
    el.style.marginBottom = "6px";
    this.messagesDiv.appendChild(el);
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }

  private setStatus(text: string) {
    if (this.statusDiv) this.statusDiv.textContent = text;
  }

  shutdown() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    if (this.socket) {
      this.socket.off("chatMessage");
      this.socket.off("chatHistory");
      this.socket.off("connect");
      this.socket.off("disconnect");
      this.socket.off("connect_error");
    }
  }

  destroy() {
    this.shutdown();
    this.scene.stop();
  }
}
