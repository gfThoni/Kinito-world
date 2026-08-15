import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  preload() {
    this.load.image("kinito-logo", "/img/kinito-world-logo.png");
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .image(width / 2, height * 0.32, "kinito-logo")
      .setDisplaySize(Math.min(width * 0.7, 700), Math.min(height * 0.35, 350));

    const playButton = this.add
      .text(width / 2, height * 0.68, "JOGAR", {
        fontFamily: "Arial",
        fontSize: "42px",
        color: "#fff4a8",
        stroke: "#172b5c",
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playButton.on("pointerdown", () => {
      this.scene.start("WorldScene");
    });
  }
}