import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";

import { Player } from "./game/player.js";
import { Bubble } from "./game/bubble.js";
import { EnemySpawner } from "./game/enemy_spawner.js";
import { TopUI } from "./game/top_ui.js";
import { UpgradeManager } from "./game/upgrades.js";

const States = {
  INTRO: "intro",
  PLAYING: "playing",
  GAMEOVER: "gameover",
};
let currentState = States.INTRO;

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

const app = new PIXI.Application();
await app.init({ background: "#60BFE0", resizeTo: window });
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
introBg.rect(0, 0, screenWidth, screenHeight);
introBg.fill(fstyle);
introContainer.addChild(introBg);

const titleStyle = new PIXI.TextStyle({
  fontSize: 48,
  fill: 0xffffff,
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
startButtonBg.roundRect(0, 0, 200, 60, 10);
startButtonBg.fill(0x4444ff);
startButton.addChild(startButtonBg);

const startTextStyle = new PIXI.TextStyle({
  fontSize: 24,
  fill: 0xffffff,
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

// bubble
const bubbleSVG = await PIXI.Assets.load({
  src: 'raw-assets/images/bubble.svg',
  data: {
      parseAsGraphicsContext: true,
  },
});
bubbleSVG.instructions[1].data.style.cap = 'round'
bubbleSVG.instructions[2].data.style.cap = 'round'
bubbleSVG.instructions[3].data.style.cap = 'round'
const bubble_graphics = new PIXI.Graphics(bubbleSVG)
const bubble_bounds = bubble_graphics.getLocalBounds();
bubble_graphics.pivot.set((bubble_bounds.x + bubble_bounds.width) / 2, (bubble_bounds.y + bubble_bounds.height) / 2);
bubble_graphics.alpha = 0.5
viewport.addChild(bubble_graphics)

// Player
await PIXI.Assets.load("raw-assets/images/player-top.png");
const arm_sprite = PIXI.Sprite.from("raw-assets/images/player-top.png");
arm_sprite.anchor.set(0.5);
viewport.addChild(arm_sprite);

await PIXI.Assets.load("raw-assets/images/player-body.png");
const player_sprite = PIXI.Sprite.from("raw-assets/images/player-body.png");
player_sprite.anchor.set(0.5);
viewport.addChild(player_sprite);


let top_ui;

const GameState = {
  Player: new Player(player_sprite, arm_sprite, viewport),
  Bubble: new Bubble(bubble_graphics, viewport),
};

const enemyTexture1 = await PIXI.Assets.load("raw-assets/images/Fish1.svg");
const enemyTexture2 = await PIXI.Assets.load("raw-assets/images/Fish2.svg");
const enemyTexture3 = await PIXI.Assets.load("raw-assets/images/Fish3.svg");
const enemySpawner = new EnemySpawner(
  app,
  viewport,
  GameState.Bubble,
  GameState.Player
);
enemySpawner.enemyTexture1 = enemyTexture1;
enemySpawner.enemyTexture2 = enemyTexture2;
enemySpawner.enemyTexture3 = enemyTexture3;

// Center viewport on circle
viewport.moveCenter(bubble_graphics);

const gameOverBg = new PIXI.Graphics();
gameOverBg.rect(0, 0, screenWidth, screenHeight);
gameOverBg.fill(fstyle);
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
restartButtonBg.roundRect(0, 0, 200, 60, 10);
restartButtonBg.fill(0x228b22);
restartButton.addChild(restartButtonBg);

const restartTextStyle = new PIXI.TextStyle({ fontSize: 24, fill: 0xffffff });
const restartText = new PIXI.Text({ text: "Restart", style: restartTextStyle });
restartText.anchor.set(0.5);
restartText.x = 100;
restartText.y = 30;
restartButton.addChild(restartText);

restartButton.on("pointerdown", () => {
  resetGame();
});

const introAudio = new Audio("raw-assets/audio/intro.wav");
introAudio.loop = true;
introAudio.volume = 0.5;

const bubbleAudio = new Audio("raw-assets/audio/bubble.wav");
bubbleAudio.loop = true;
bubbleAudio.volume = 0.5;

const waterAudio = new Audio("raw-assets/audio/water.wav");
waterAudio.loop = true;
waterAudio.volume = 0.0;

const popAudio = new Audio("raw-assets/audio/pop.wav");
popAudio.loop = false;

let bubbleVolume = 0.5;
let waterVolume = 0.0;
const fadeSpeed = 0.025;

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

let paused = false;
let other_mouse_click = true;
let mouse_needed = true;
// Mouse click => unify to dash with space
window.addEventListener("mousedown", (e) => {
  if (e.button === 0 && !other_mouse_click && !mouse_needed) {
    keys["mouse_dash"] = true;
  }
});
window.addEventListener("mouseup", (e) => {
  if (e.button === 0 && !mouse_needed) {
    other_mouse_click = false;
    keys["mouse_dash"] = false;
  }
});

await PIXI.Assets.load("raw-assets/images/tree.svg");
const upgrade_sprite = PIXI.Sprite.from("raw-assets/images/tree.svg");
upgrade_sprite.anchor.set(0.5);
viewport.addChild(upgrade_sprite);

const upgradeManager = new UpgradeManager(
  app,
  GameState.Bubble,
  GameState.Player,
  upgrade_sprite
);
viewport.addChild(upgradeManager.stationContainer);
app.stage.addChild(upgradeManager.menuContainer);

upgradeManager.onOpen = () => {
  paused = true;
  mouse_needed = true;
  other_mouse_click = true;
  waterAudio.volume = 0
  fadeAudio(bubbleAudio, bubbleAudio.volume, 0.25, 250);
};
upgradeManager.onClose = () => {
  fadeAudio(bubbleAudio, bubbleAudio.volume, 0.5, 100);
  bubbleAudio.volume = 0.5;
  waterAudio.volume = 0;
  paused = false;
  mouse_needed = false;
};

function fadeAudio(audioElement, startVolume, endVolume, duration) {
  const intervalTime = 10;
  const step = (endVolume - startVolume) * (intervalTime / duration);
  audioElement.volume = startVolume;

  const interval = setInterval(() => {
    // Increment volume until it reaches or exceeds endVolume
    if ((step > 0 && audioElement.volume < endVolume) ||
        (step < 0 && audioElement.volume > endVolume)) {
      audioElement.volume += step;
    } else {
      // Ensure volume does not exceed boundaries
      audioElement.volume = endVolume;
      clearInterval(interval); // Stop the interval
    }
  }, intervalTime);
}

bubble_graphics.zIndex = 4;
upgradeManager.stationContainer.zIndex = 1;
player_sprite.zIndex = 2;
arm_sprite.zIndex = 3;
viewport.sortChildren();
let wait_for_a_release = false;

function gameLoop(delta) {
  // Poll gamepad
  if (gamepadConnected) {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0];
    if (gp) {
      // Normalize button and axis mapping
      const isStandardMapping = gp.mapping === "standard"; // "standard" mapping for most modern controllers

      // Left stick: axes[0], axes[1] for "standard"; fallback for non-standard
      const leftStickX = isStandardMapping ? gp.axes[0] : gp.axes[0] || 0;
      const leftStickY = isStandardMapping ? gp.axes[1] : gp.axes[1] || 0;

      // Right stick: axes[2], axes[3] for "standard"; fallback for non-standard
      const rightStickX = isStandardMapping ? gp.axes[2] : gp.axes[2] || 0;
      const rightStickY = isStandardMapping ? gp.axes[3] : gp.axes[3] || 0;

      // Buttons: A (Xbox) / Cross (PS) is buttons[0]; Right Trigger is buttons[7]
      const buttonA = gp.buttons[0]?.pressed || false; // A on Xbox / Cross on PS
      const buttonB = gp.buttons[1]?.pressed || false; // A on Xbox / Cross on PS
      const buttonRT = gp.buttons[7]?.pressed || false; // Right Trigger
      const buttonR = gp.buttons[5]?.pressed || false; // Right Bumper
      const buttonLT = gp.buttons[6]?.pressed || false; // Left Trigger
      const buttonL = gp.buttons[4]?.pressed || false; // Left Bumper

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

      if (wait_for_a_release && !buttonA) {
        wait_for_a_release = false
      }
      if (currentState === States.INTRO && buttonA) {
        wait_for_a_release = true
        setState(States.PLAYING)
      }
      // Restart game when in GAMEOVER state
      if (currentState === States.GAMEOVER && buttonA) {
        wait_for_a_release = true
        resetGame()
      }

      if (!wait_for_a_release) {
        keys["controller_a"] = buttonA
      } else {
        keys["controller_a"] = false;
      }
      keys["controller_b"] = buttonB
      keys["controller_dash"] = buttonRT || buttonR || buttonLT || buttonL;
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
    if (keys["c"] || keys["controller_b"]) {
      upgradeManager.closeMenu();
      paused = false;
    }
  }
  render();
}

function update(delta) {
  switch (currentState) {
    case States.INTRO:
      mouse_needed = true;
      other_mouse_click = true;
      break;

    case States.PLAYING:
      mouse_needed = false;

      if (!top_ui) {
        top_ui = new TopUI(app, screenWidth);
      }

      // Bubble
      GameState.Bubble.update(delta);
      const pos = GameState.Player.get_position();
      const inBubble = GameState.Bubble.contains(pos.x, pos.y);

      // Player
      GameState.Player.update(delta, keys, mousePos, GameState.Bubble, inBubble)

      // Enemies
      enemySpawner.update(delta);

      // Upgrades
      upgradeManager.update(delta, keys, top_ui);

      // UI
      top_ui.update(GameState.Player, GameState.Bubble, delta);

      // Crossfade bubble/water
      if (!paused) {
        let targetBubble = inBubble ? 0.5 : 0.0;
        let targetWater = 0.5 - targetBubble;
        bubbleVolume += (targetBubble - bubbleVolume) * fadeSpeed;
        waterVolume += (targetWater - waterVolume) * fadeSpeed;
        bubbleVolume = Math.max(0, Math.min(1, bubbleVolume));
        waterVolume = Math.max(0, Math.min(1, waterVolume));
        bubbleAudio.volume = bubbleVolume;
        waterAudio.volume = waterVolume;
      }

      // Lose condition
      if (
        GameState.Bubble.oxygen <= 0 ||
        (GameState.Player.oxygen <= 0 &&
          !GameState.Player.in_bubble &&
          !GameState.Player.dashing)
      ) {
        setState(States.GAMEOVER);
      }
      break;

    case States.GAMEOVER:
      mouse_needed = true;
      other_mouse_click = true;
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

  introContainer.visible = currentState === States.INTRO;
  gameContainer.visible = currentState === States.PLAYING;
  gameOverContainer.visible = currentState === States.GAMEOVER;
}

function resetGame() {
  introAudio.pause();
  GameState.Bubble.reset();
  GameState.Player.reset();
  enemySpawner.reset();
  upgradeManager.reset();
  top_ui.igt = 0;

  bubbleVolume = 0.5;
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
