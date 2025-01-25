// I installed pixie-viewport with npm i pixi-viewport, how do I use it in my code?
import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";

// set screen width and height variables to the window size
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

const app = new PIXI.Application();
await app.init({ background: "#1099bb", resizeTo: window });
document.body.appendChild(app.canvas);

// // Load a texture and create a sprite
// await PIXI.Assets.load("sample.png");
// const sprite = PIXI.Sprite.from("sample.png");
// app.stage.addChild(sprite);

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

// const sprite2 = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
// sprite2.tint = 0xff0000;
// sprite2.width = sprite2.height = 100;
// sprite2.position.set(100, 100);

// add a blue circle in the center of the view
const circle = new PIXI.Graphics();
circle.fill(0x0000ff);
circle.circle(0, 0, 50);
circle.fill();
viewport.addChild(circle);

// add a triangle on the screen
const triangle = new PIXI.Graphics();
triangle.fill(0xff0000);
triangle.moveTo(0, -50);
triangle.lineTo(50, 50);
triangle.lineTo(-50, 50);
triangle.closePath();
triangle.fill();
viewport.addChild(triangle);


await PIXI.Assets.load("sample.png");
const sprite = PIXI.Sprite.from("sample.png");
app.stage.addChild(sprite);


// move the viewport to center on the circle
viewport.moveCenter(circle);

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

  // move the circle back and forth

  circle.x = 100 * Math.sin(app.ticker.lastTime / 1000);

  const speed = 5;
  if (keys["w"] || keys["W"]) {
    triangle.y -= speed;
  }
  if (keys["s"] || keys["S"]) {
    triangle.y += speed;
  }
  if (keys["a"] || keys["A"]) {
    triangle.x -= speed;
  }
  if (keys["d"] || keys["D"]) {
    triangle.x += speed;
  }
}

// Render function to handle drawing
function render() {
  // Draw game objects, update viewport, etc.

  // Example: Clear the screen and redraw the circle
  viewport.moveCenter(triangle);
  app.renderer.render(app.stage);
}

// Start the game loop
app.ticker.add(gameLoop);
