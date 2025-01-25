// I installed pixie-viewport with npm i pixi-viewport, how do I use it in my code?
import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";

import { Player } from "./game/player.js";
import { Bubble } from "./game/bubble.js";

// set screen width and height variables to the window size
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

const app = new PIXI.Application();
await app.init({ background: "#1099bb", resizeTo: window });
document.body.appendChild(app.canvas);

// create viewport
const viewport = new pixi_viewport.Viewport({
  screenWidth: screenWidth,
  screenHeight: screenHeight,
  worldWidth: screenWidth,
  worldHeight: screenHeight,
  events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
});

// add the viewport to the stage
app.stage.addChild(viewport);

// activate plugins
viewport.drag().pinch().wheel().decelerate();

// add a blue circle in the center of the view
const bubble_sprite = new PIXI.Graphics();
bubble_sprite.fill(0xADD8E6);
bubble_sprite.circle(0, 0, 50);
bubble_sprite.fill();
viewport.addChild(bubble_sprite);

// Create player sprite
await PIXI.Assets.load("raw-assets/images/Black_triangle.svg");
const player_sprite = PIXI.Sprite.from("raw-assets/images/Black_triangle.svg");
player_sprite.anchor.set(0.5); // Set the anchor to the center of the sprite
viewport.addChild(player_sprite);



const GameState = {
  score: 0,
  level: 1,
  Player: new Player(player_sprite),
  Bubble: new Bubble(bubble_sprite),
  enemies: [],
  bullets: [],
  // Add more properties as needed
};

console.log(GameState.Player.x);



// move the viewport to center on the circle
viewport.moveCenter(bubble_sprite);

// move the viewport with the arrow keys

let keys = {};

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

// Game loop
function gameLoop(delta) {
  // Update game state
  update(delta);

  // Render the current state
  render();
}

// Update function to handle game logic
function update(delta) {
  // Update game objects, handle input, etc.
  // log a tick to the console
  // console.log("Tick:", delta);

  // make the circle grow and shrink over time
  GameState.Bubble.setScale(3.5 + 0.5 * Math.sin(Date.now() * 0.001));


  // Movement speed
  const speed = 5;

  // Each frame, figure out the net direction of movement
  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["W"]) {
    dy -= 1;
  }
  if (keys["s"] || keys["S"]) {
    dy += 1;
  }
  if (keys["a"] || keys["A"]) {
    dx -= 1;
  }
  if (keys["d"] || keys["D"]) {
    dx += 1;
  }

  // Normalize diagonal speed (optional)
  // This step ensures moving diagonally isn’t “faster” than cardinal directions
  // but in many games people just skip this. If you want it smooth, do this:
  if (dx !== 0 || dy !== 0) {
    // Compute magnitude
    const mag = Math.sqrt(dx * dx + dy * dy);
    dx /= mag;
    dy /= mag;
  }

  // Now move the sprite
  GameState.Player.PlayerSprite.x += dx * speed;
  GameState.Player.PlayerSprite.y += dy * speed;

  // Rotate the sprite if we’re actually moving
  // (i.e., dx or dy is non-zero)
  if (dx !== 0 || dy !== 0) {
    // Compute the angle in radians
    // atan2(Y, X) => 0 rad is “facing right,” angles go CCW
    const angle = Math.atan2(dy, dx);
    
    // If your sprite texture points “up” at 0 radians, subtract π/2
    // If it’s already aligned to the right, you can skip the offset
    GameState.Player.PlayerSprite.rotation = angle - Math.PI / 2;
  }
}

// Render function to handle drawing
function render() {
  // Draw game objects, update viewport, etc.

  viewport.moveCenter(GameState.Player.PlayerSprite);
  // app.renderer.render(app.stage);
}

// Start the game loop
app.ticker.add(gameLoop);
