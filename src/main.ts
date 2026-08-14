import Phaser from "phaser";
import { WorldScene } from "./game/scenes/WorldScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  width: window.innerWidth,
  height: window.innerHeight,

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  backgroundColor: "#000000",

  scene: [WorldScene]
};

new Phaser.Game(config);