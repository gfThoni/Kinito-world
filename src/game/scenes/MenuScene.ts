import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  preload() {
    this.load.image("kinito-logo", "img/logo.png");
  }

  create() {
    const { width, height } = this.scale;

    const logo = this.add.image(width / 2, height * 0.32, "kinito-logo");
    // scale logo to fit nicely while preserving aspect ratio
    const maxWidth = Math.min(width * 0.7, 900);
    const scale = Math.min(1, maxWidth / (logo.width || maxWidth));
    logo.setScale(scale);
    logo.setOrigin(0.5);

    // Name input using DOM overlay (required)
    const nameContainer = document.createElement("div");
    nameContainer.style.position = "fixed";
    nameContainer.style.left = "50%";
    nameContainer.style.top = "62%";
    nameContainer.style.transform = "translateX(-50%)";
    nameContainer.style.display = "flex";
    nameContainer.style.gap = "8px";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Digite seu nome (obrigatório)";
    nameInput.style.padding = "10px";
    nameInput.style.fontSize = "16px";
    nameInput.style.borderRadius = "6px";

    const playButton = document.createElement("button");
    playButton.textContent = "JOGAR";
    playButton.style.padding = "10px 18px";
    playButton.style.fontSize = "16px";
    playButton.style.borderRadius = "6px";
    playButton.style.background = "#2874ff";
    playButton.style.color = "#fff";
    playButton.style.border = "none";

    playButton.addEventListener("click", () => {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        nameInput.style.border = "2px solid #ff4d4d";
        return;
      }

      // persist and start world with name
      localStorage.setItem("playerName", name);
      // remove DOM UI
      if (nameContainer.parentNode) nameContainer.parentNode.removeChild(nameContainer);
      this.scene.start("WorldScene", { playerName: name });
    });

    nameInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") playButton.click();
    });

    nameContainer.appendChild(nameInput);
    nameContainer.appendChild(playButton);
    document.body.appendChild(nameContainer);
  }
}