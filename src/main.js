import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";

import { Player } from "./game/player.js";
import { Bubble } from "./game/bubble.js";
import { EnemySpawner } from "./game/enemy_spawner.js";
import { OxygenUI } from "./game/oxygen_ui.js";
import { UpgradeManager } from "./game/upgrades.js";

const States = {
  INTRO: "intro",
  PLAYING: "playing",
  GAMEOVER: "gameover"
};
let currentState = States.INTRO;

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

const app = new PIXI.Application();
await app.init({ background: "#1099bb", resizeTo: window });
document.body.appendChild(app.canvas);

// Create viewport
const viewport = new pixi_viewport.Viewport({
  screenWidth: screenWidth,
  screenHeight: screenHeight,
  worldWidth: screenWidth,
  worldHeight: screenHeight,
  events: app.renderer.events,
});
viewport.sortableChildren = true;
viewport.drag().pinch().wheel().decelerate();

const introContainer = new PIXI.Container();
introContainer.visible = true;

const gameContainer = new PIXI.Container();
gameContainer.visible = false;

const gameOverContainer = new PIXI.Container();
gameOverContainer.visible = false;

app.stage.addChild(introContainer);
app.stage.addChild(gameContainer);
app.stage.addChild(gameOverContainer);

gameContainer.addChild(viewport);

const introBg = new PIXI.Graphics();
const fstyle = new PIXI.toFillStyle(0x000000, 0.75);
introBg.fill(fstyle);
introBg.rect(0, 0, screenWidth, screenHeight);
introBg.fill();
introContainer.addChild(introBg);

const titleStyle = new PIXI.TextStyle({
  fontSize: 48,
  fill: 0xffffff
});
const titleText = new PIXI.Text({ text: "Bubble Defender", style: titleStyle });
titleText.anchor.set(0.5);
titleText.x = screenWidth / 2;
titleText.y = screenHeight / 2 - 50;
introContainer.addChild(titleText);

const startButton = new PIXI.Container();
startButton.x = screenWidth / 2 - 100;
startButton.y = screenHeight / 2 + 20;
startButton.interactive = true;
startButton.buttonMode = true;

const startButtonBg = new PIXI.Graphics();
startButtonBg.fill(0x4444ff);
startButtonBg.roundRect(0, 0, 200, 60, 10);
startButtonBg.fill();
startButton.addChild(startButtonBg);

const startTextStyle = new PIXI.TextStyle({
  fontSize: 24,
  fill: 0xffffff
});
const startText = new PIXI.Text({ text: "Start Game", style: startTextStyle });
startText.anchor.set(0.5);
startText.x = 100;
startText.y = 30;
startButton.addChild(startText);

introContainer.addChild(startButton);

startButton.on("pointerdown", () => {
  setState(States.PLAYING);
});

// Blue circle
const bubble_sprite = new PIXI.Graphics();
bubble_sprite.fill(0xADD8E6);
bubble_sprite.circle(0, 0, 10);
bubble_sprite.fill();
viewport.addChild(bubble_sprite);

// Player
await PIXI.Assets.load("raw-assets/images/Black_triangle.svg");
const player_sprite = PIXI.Sprite.from("raw-assets/images/Black_triangle.svg");
player_sprite.anchor.set(0.5);
viewport.addChild(player_sprite);

let oxygen_ui;

const GameState = {
  score: 0,
  level: 1,
  Player: new Player(player_sprite, viewport),
  Bubble: new Bubble(bubble_sprite),
  enemies: [],
  bullets: [],
};

const enemyTexture = await PIXI.Assets.load("raw-assets/images/fish-svgrepo-com.svg");
const enemySpawner = new EnemySpawner(app, viewport, GameState.Bubble, GameState.Player);
enemySpawner.enemyTexture = enemyTexture;

// Center viewport on circle
viewport.moveCenter(bubble_sprite);

const gameOverBg = new PIXI.Graphics();
gameOverBg.fill(fstyle);
gameOverBg.rect(0, 0, screenWidth, screenHeight);
gameOverBg.fill();
gameOverContainer.addChild(gameOverBg);

const overTextStyle = new PIXI.TextStyle({
  fontSize: 48,
  fill: 0xff0000,
});
const overText = new PIXI.Text({ text: "Game Over!", style: overTextStyle });
overText.anchor.set(0.5);
overText.x = screenWidth / 2;
overText.y = screenHeight / 2 - 50;
gameOverContainer.addChild(overText);

const restartButton = new PIXI.Container();
restartButton.x = screenWidth / 2 - 100;
restartButton.y = screenHeight / 2 + 20;
restartButton.interactive = true;
restartButton.buttonMode = true;
gameOverContainer.addChild(restartButton);

const restartButtonBg = new PIXI.Graphics();
restartButtonBg.fill(0x228B22);
restartButtonBg.roundRect(0, 0, 200, 60, 10);
restartButtonBg.fill();
restartButton.addChild(restartButtonBg);

const restartTextStyle = new PIXI.TextStyle({ fontSize: 24, fill: 0xffffff });
const restartText = new PIXI.Text({ text: "Restart", style: restartTextStyle });
restartText.anchor.set(0.5);
restartText.x = 100;
restartText.y = 30;
restartButton.addChild(restartText);

restartButton.on("pointerdown", () => {
  resetGame();
  // setState(States.PLAYING); // Moved to resetGame
});



const introAudio = new Audio("raw-assets/audio/intro.wav");
introAudio.loop = true;
introAudio.volume = 0.5;

const bubbleAudio = new Audio("raw-assets/audio/bubble.wav");
bubbleAudio.loop = true;
bubbleAudio.volume = 1.0;

const waterAudio = new Audio("raw-assets/audio/water.wav");
waterAudio.loop = true;
waterAudio.volume = 0.0;

const popAudio = new Audio("raw-assets/audio/pop.mp3");
popAudio.loop = false;

let bubbleVolume = 1.0;
let waterVolume = 0.0;
const fadeSpeed = 0.05;

let introAudioStarted = false;
function onFirstMouseDown() {
  if (!introAudioStarted) {
    introAudio.play();
    introAudioStarted = true;
  }
}
window.addEventListener("mousedown", onFirstMouseDown);

let keys = {};
let mousePos = { x: 0, y: 0 };

// Keyboard
window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
});
window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// Mouse movement
window.addEventListener("pointermove", (event) => {
  mousePos.x = event.x;
  mousePos.y = event.y;
});

// Mouse click => unify to dash with space
window.addEventListener("mousedown", (e) => {
  if (e.button === 0 && States.PLAYING) {
    keys[" "] = true;
  }
});
window.addEventListener("mouseup", (e) => {
  if (e.button === 0 && States.PLAYING) {
    keys[" "] = false;
  }
});

const upgradeManager = new UpgradeManager(app, GameState.Bubble, GameState.Player);
viewport.addChild(upgradeManager.stationContainer);
app.stage.addChild(upgradeManager.menuContainer);

let paused = false;
upgradeManager.onOpen = () => {
  bubbleAudio.volume = 0.5;
  waterAudio.volume = 0;
  paused = true;
};
upgradeManager.onClose = () => {
  bubbleAudio.volume = 1;
  waterAudio.volume = 0;
  paused = false;
};

bubble_sprite.zIndex = 0;
upgradeManager.stationContainer.zIndex = 1;
player_sprite.zIndex = 2;
viewport.sortChildren();

function gameLoop(delta) {
  // Poll gamepad
  if (gamepadConnected) {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0];
    if (gp) {
      // Left stick: axes[0], axes[1]
      const leftStickX = gp.axes[0] || 0;
      const leftStickY = gp.axes[1] || 0;

      // Right stick: axes[2], axes[3]
      const rightStickX = gp.axes[2] || 0;
      const rightStickY = gp.axes[3] || 0;

      // Dead zone function
      function applyDeadZone(ax, ay, deadZone = 0.1) {
        const mag = Math.sqrt(ax * ax + ay * ay);
        return mag > deadZone ? [ax / mag, ay / mag] : [0, 0];
      }

      // Apply deadzone to left stick
      const [lx, ly] = applyDeadZone(leftStickX, leftStickY, 0.2); // Deadzone = 0.2
      keys.gpX = lx;
      keys.gpY = ly;

      // Apply deadzone to right stick
      const [rx, ry] = applyDeadZone(rightStickX, rightStickY, 0.1); // Deadzone = 0.1
      keys.gpRX = rx;
      keys.gpRY = ry;

      // For dash with right trigger or "A" button:
      // (Typically gp.buttons[0] = A, gp.buttons[7] = Right Trigger, etc.)
      if (gp.buttons[7].pressed || gp.buttons[0].pressed) {
        keys[" "] = true;
      } else {
        keys[" "] = false;
      }

      // Check for restart input when GAMEOVER
      if (currentState === States.GAMEOVER && gp.buttons[0].pressed) {
        resetGame(); // Restart the game when "A" is pressed
      }
    }
  } else {
    // No gamepad
    keys.gpX = 0;
    keys.gpY = 0;
    keys.gpRX = 0;
    keys.gpRY = 0;
  }

  if (!paused) {
    update(delta);
  } else {
    if (keys["c"]) {
      upgradeManager.closeMenu();
      paused = false;
    }
  }
  render();
}



function update(delta) {
  switch (currentState) {
    case States.INTRO:
      break;

    case States.PLAYING:
      if (!oxygen_ui) {
        oxygen_ui = new OxygenUI(app, screenWidth);
      }
      // Bubble
      GameState.Bubble.grow(delta);
      const pos = GameState.Player.get_position();
      const inBubble = GameState.Bubble.contains(pos.x, pos.y);

      // Player
      GameState.Player.move(delta, keys, mousePos, inBubble);
      GameState.Player.updateOxygen(delta, GameState.Bubble);
      GameState.Player.updateParticles(delta);

      // Enemies
      enemySpawner.update(delta);

      // Upgrades
      upgradeManager.update(delta, keys, oxygen_ui);

      // UI
      oxygen_ui.update(GameState.Player, GameState.Bubble);

      // Crossfade bubble/water
      let targetBubble = inBubble ? 1.0 : 0.0;
      let targetWater = 1.0 - targetBubble;
      bubbleVolume += (targetBubble - bubbleVolume) * fadeSpeed;
      waterVolume += (targetWater - waterVolume) * fadeSpeed;
      bubbleVolume = Math.max(0, Math.min(1, bubbleVolume));
      waterVolume = Math.max(0, Math.min(1, waterVolume));
      bubbleAudio.volume = bubbleVolume;
      waterAudio.volume = waterVolume;

      // Lose condition
      if (GameState.Bubble.oxygen <= 0 || GameState.Player.oxygen <= 0) {
        setState(States.GAMEOVER);
      }
      break;

    case States.GAMEOVER:
      break;
  }
}

function render() {
  if (currentState === States.PLAYING) {
    viewport.moveCenter(GameState.Player.PlayerSprite);
  }
}

function setState(newState) {
  if (currentState === States.INTRO && newState === States.PLAYING) {
    if (!introAudioStarted) {
      introAudioStarted = true;
    }
    introAudio.pause();
    introAudio.currentTime = 0;
    bubbleAudio.currentTime = 0;
    waterAudio.currentTime = 0;
    bubbleAudio.play();
    waterAudio.play();
  }

  if (currentState === States.PLAYING && newState === States.GAMEOVER) {
    bubbleAudio.pause();
    waterAudio.pause();
    popAudio.currentTime = 0;
    popAudio.play();
    introAudio.play();
  }

  currentState = newState;

  introContainer.visible = (currentState === States.INTRO);
  gameContainer.visible = (currentState === States.PLAYING);
  gameOverContainer.visible = (currentState === States.GAMEOVER);
}

function resetGame() {
  introAudio.pause();
  GameState.Bubble.reset();
  GameState.Player.reset();
  enemySpawner.reset();
  upgradeManager.reset();

  bubbleVolume = 1.0;
  waterVolume = 0.0;
  bubbleAudio.play();
  waterAudio.play();

  setState(States.PLAYING);
}

app.ticker.add(gameLoop);

let gamepadConnected = false;
window.addEventListener("gamepadconnected", (event) => {
  console.log("Gamepad connected:", event.gamepad);
  gamepadConnected = true;
});
window.addEventListener("gamepaddisconnected", (event) => {
  console.log("Gamepad disconnected:", event.gamepad);
  gamepadConnected = false;
});
