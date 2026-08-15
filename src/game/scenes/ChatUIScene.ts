import Phaser from "phaser";
import type { Socket } from "socket.io-client";

export class ChatUIScene extends Phaser.Scene {
  private socket?: Socket;
  private container?: HTMLDivElement;
  private messagesDiv?: HTMLDivElement;

  constructor() {
    super("ChatUIScene");
  }

  init(data: any) {
    this.socket = data?.socket;
  }

  create() {
    this.createDOM();

    if (this.socket) {
      this.socket.on("chatMessage", (msg: any) => this.appendMessage(msg));
      this.socket.on("chatHistory", (msgs: any[]) => {
        for (const m of msgs) this.appendMessage(m);
      });
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
      this.socket.emit("chatMessage", { text });
      input.value = "";
    });

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        send.click();
      }
    });

    row.appendChild(input);
    row.appendChild(send);

    container.appendChild(messages);
    container.appendChild(row);

    document.body.appendChild(container);

    this.container = container;
    this.messagesDiv = messages;
  }

  private appendMessage(msg: any) {
    if (!this.messagesDiv) return;
    const el = document.createElement("div");
    const time = new Date(msg.ts || Date.now()).toLocaleTimeString();
    const name = msg.playerName || msg.playerId || "Player";
    el.textContent = `[${time}] ${name}: ${msg.text}`;
    el.style.marginBottom = "6px";
    this.messagesDiv.appendChild(el);
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }

  shutdown() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    if (this.socket) {
      this.socket.off("chatMessage");
      this.socket.off("chatHistory");
    }
  }

  destroy() {
    this.shutdown();
    super.destroy();
  }
}
