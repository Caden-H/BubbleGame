import * as PIXI from "pixi.js";
import { Enemy } from "./enemy.js";

export class EnemySpawner {
  constructor(app, viewport, bubble, player) {
    this.app = app;
    this.viewport = viewport;
    this.bubble = bubble;
    this.player = player;
    this.enemyTexture1 = PIXI.Texture.WHITE; // placeholder
    this.enemyTexture2 = PIXI.Texture.WHITE; // placeholder
    this.enemyTexture3 = PIXI.Texture.WHITE; // placeholder

    this.enemies = [];
    this.reset()
  }

  reset() {
    this.enemies.forEach((e) => {
        this.viewport.removeChild(e.sprite);
        e.sprite.destroy();
      });
      this.enemies = [];

      this.spawnTimer = 0;
      this.spawnInterval = 1; // in seconds
      this.total_seconds = 0;
  }

  update(delta) {
    this.spawnTimer += delta.elapsedMS / 1000;
    this.total_seconds += delta.elapsedMS / 1000;
    this.spawnInterval = 0.9 ** Math.floor(this.total_seconds / 30)
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      let damage = Math.ceil(this.total_seconds / 60) * 3
      let oxygen = Math.ceil(this.total_seconds / 60)
      let health = Math.ceil(this.total_seconds / 60)
      this.spawnEnemy(damage, oxygen, health);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.dead) {
        this.viewport.removeChild(enemy.sprite);
        this.enemies.splice(i, 1);
        enemy.kill();
        continue;
      }

      enemy.update(delta, this.bubble);

      if (this.player.dashing) {
        this.checkDashCollision(enemy);
      }
    }
  }

  spawnEnemy(damage, oxygen, health) {
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
    let enemy;
    if (health == 1) {
      enemy = new Enemy(this.enemyTexture1, x, y, damage, oxygen, health);
    } else if (health == 2) {
      enemy = new Enemy(this.enemyTexture2, x, y, damage, oxygen, health);
    } else if (health >= 3) {
      enemy = new Enemy(this.enemyTexture3, x, y, damage, oxygen, health);
    }
    this.viewport.addChild(enemy.sprite);
    this.enemies.push(enemy);
  }

  /**
   * If the player is dashing, we check the distance from the enemy to the player’s sprite.
   * If within some small radius, kill the enemy (or reduce enemy HP if you prefer).
   */
  checkDashCollision(enemy) {
    // Pick some collision radius
    const collisionRadius = 50;
    let player_pos = this.player.get_position()
    let enemy_pos = enemy.get_position()
    const dx = enemy_pos.x - player_pos.x;
    const dy = enemy_pos.y - player_pos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist <= collisionRadius) {
      // "Kill" the enemy
      enemy.health -= this.player.dash_damage;
      if (enemy.health <= 0) {
        enemy.kill();
        this.player.dash_cancelable = true;
        this.player.oxygen = Math.min(this.player.oxygen + enemy.oxygen, this.player.max_oxygen)
      }
    }
  }
}
