import * as Phaser from "../../node_modules/phaser/dist/phaser.esm.js";
import { createLadybugGame } from "../../packages/game-core/src/ladybug-game.js";

const params = new URLSearchParams(window.location.search);
const mobile = params.get("mobile") === "1";

createLadybugGame(Phaser, { mobile });