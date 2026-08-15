import Phaser from "phaser";
import { WorldScene } from "./game/scenes/WorldScene";
import { MenuScene } from "./game/scenes/MenuScene";  

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  width: window.innerWidth,
  height: window.innerHeight,

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  backgroundColor: "#00bbff",

  scene: [MenuScene, WorldScene]
};

new Phaser.Game(config);                      