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
bubble_sprite.circle(0, 0, 10);
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



// move the viewport to center on the circle
viewport.moveCenter(bubble_sprite);

let keys = {};
let mousePos = {x: 0, y: 0}

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

window.addEventListener('pointermove', (event) =>
  {
    mousePos.x = event.x;
    mousePos.y = event.y;
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
  GameState.Bubble.grow(delta)
  const player_position = GameState.Player.get_position()
  const player_in_bubble = GameState.Bubble.contains(player_position.x, player_position.y)

  GameState.Player.move(delta, keys, mousePos, player_in_bubble)

}

// Render function to handle drawing
function render() {
  // Draw game objects, update viewport, etc.

  viewport.moveCenter(GameState.Player.PlayerSprite);
  // app.renderer.render(app.stage);
}

// Start the game loop
app.ticker.add(gameLoop);
