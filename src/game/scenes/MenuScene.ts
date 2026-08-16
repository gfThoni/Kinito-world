import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  preload() {
    this.load.image("kinito-logo", "/img/logo.png");
  }

  create() {
    const { width, height } = this.scale;

    const logo = this.add.image(
      width / 2,
      height / 2.8,
      "kinito-logo"
    );

    const maxWidth = Math.min(width * 0.65, 520);
    const scale = maxWidth / logo.width;

    logo.setScale(scale);
    logo.setOrigin(0.5);

    const playButton = this.add
      .text(width / 2, height * 0.72, "JOGAR", {
        fontFamily: "Arial",
        fontSize: "42px",
        color: "#ffffff",
        backgroundColor: "#2874ff",
        padding: {
          left: 30,
          right: 30,
          top: 15,
          bottom: 15
        }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playButton.on("pointerdown", () => {
  this.scene.start("WorldScene");
});
  }
}