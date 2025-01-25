import * as PIXI from "pixi.js";
import { Enemy } from "./enemy.js";

/**
 * This class is responsible for:
 *  - Periodically spawning enemies offscreen
 *  - Updating all enemies (so they move & damage the bubble)
 *  - Checking if the player is dashing and killing enemies on collision
 */
export class EnemySpawner {
  constructor(app, viewport, bubble, player) {
    this.app = app;
    this.viewport = viewport;
    this.bubble = bubble; // reference to your Bubble instance
    this.player = player; // reference to your Player instance

    // You need an enemy texture or image. You can load something like:
    //   await PIXI.Assets.load("raw-assets/images/enemy.png");
    // or pass it from outside. For a placeholder, you can generate a basic graphic or re-use an existing texture.
    this.enemyTexture = PIXI.Texture.WHITE; // Just a white square placeholder

    this.enemies = [];

    // Spawn settings
    this.spawnTimer = 0;
    this.spawnInterval = 60;

    // How far offscreen to spawn
    this.spawnMargin = 50;
  }

  update(delta) {
    // 1) Check if time to spawn a new enemy
    this.spawnTimer += delta.deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // 2) Update all enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.dead) {
        this.viewport.removeChild(enemy.sprite);
        enemy.sprite.destroy();
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.update(delta, this.bubble);

      if (this.player.dashing) {
        this.checkDashCollision(enemy);
      }
    }
  }

  spawnEnemy() {
    // pick random side: 0=top,1=right,2=bottom,3=left
    const side = Math.floor(Math.random() * 4);

    const screenW = this.app.renderer.width; 
    const screenH = this.app.renderer.height;
    const bubble_pos = this.bubble.get_position()

    let x, y;
    switch(side) {
      case 0: // top
        x = Math.random() * screenW;
        y = bubble_pos.y - screenH;
        break;
      case 1: // right
        x = screenW + bubble_pos.x;
        y = Math.random() * screenH;
        break;
      case 2: // bottom
        x = Math.random() * screenW;
        y = screenH + bubble_pos.y;
        break;
      case 3: // left
        x = bubble_pos.x - screenW;
        y = Math.random() * screenH;
        break;
    }

    // Create new enemy
    const enemy = new Enemy(this.enemyTexture, x, y);
    this.viewport.addChild(enemy.sprite);
    this.enemies.push(enemy);
  }

  /**
   * If the player is dashing, we check the distance from the enemy to the player’s sprite.
   * If within some small radius, kill the enemy (or reduce enemy HP if you prefer).
   */
  checkDashCollision(enemy) {
    // Pick some collision radius
    const collisionRadius = 30;
    let player_pos = this.player.get_position()
    let enemy_pos = enemy.get_position()
    const dx = enemy_pos.x - player_pos.x;
    const dy = enemy_pos.y - player_pos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist <= collisionRadius) {
      // "Kill" the enemy
      enemy.dead = true;
      this.player.oxygen = Math.min(this.player.oxygen + enemy.oxygen, this.player.max_oxygen)

      // Optionally let the player restore some oxygen or something:
      // this.player.currentO2 = Math.min(this.player.currentO2 + 5, this.player.maxO2);
    }
  }
}
