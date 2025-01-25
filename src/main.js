// Create the application helper and add its render target to the page
const app = new PIXI.Application();
await app.init({ width: 640, height: 600 });
document.body.appendChild(app.canvas);

// Load a texture and create a sprite
await PIXI.Assets.load('sample.png');
const sprite = PIXI.Sprite.from('sample.png');
app.stage.addChild(sprite);

// Move the sprite back and forth
let elapsed = 0.0;
app.ticker.add((ticker) => {
  elapsed += ticker.deltaTime;
  sprite.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0;
});


// create viewport
const viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 1000,
    worldHeight: 1000,
    events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
  });
  
  // add the viewport to the stage
  app.stage.addChild(viewport);
  
  // activate plugins
  viewport.drag().pinch().wheel().decelerate();
  
  // add a red box
  const sprite2 = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
  sprite2.tint = 0xff0000;
  sprite2.width = sprite2.height = 100;
  sprite2.position.set(100, 100);




