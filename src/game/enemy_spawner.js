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
      this.intitialSpawnInterval = 1 // in seconds
      this.spawnInterval = this.intitialSpawnInterval;
      this.total_seconds = 0;
  }

  update(delta) {
    this.spawnTimer += delta.elapsedMS / 1000;
    this.total_seconds += delta.elapsedMS / 1000;
    this.spawnInterval = 0.9 ** Math.floor(this.total_seconds / 30) * this.intitialSpawnInterval;
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
      } else {
        enemy.hit = false;
      }
    }
  }

  spawnEnemy(damage, oxygen, health) {
    const spawnRadius = 2000;
  
    const angle = Math.random() * 2 * Math.PI;
    const radius = spawnRadius + Math.random() * 100;
  
    const bubble_x = this.bubble.BubbleSprite.x;
    const bubble_y = this.bubble.BubbleSprite.y;
  
    let x = bubble_x + radius * Math.cos(angle);
    let y = bubble_y + radius * Math.sin(angle);
  
    let enemyTexture;
    if (health == 1) {
      enemyTexture = this.enemyTexture1;
    } else if (health == 2) {
      enemyTexture = this.enemyTexture2;
    } else if (health >= 3) {
      enemyTexture = this.enemyTexture3;
    }
  
    let enemy = new Enemy(enemyTexture, x, y, damage, oxygen, health, this.viewport);
    this.viewport.addChild(enemy.sprite);
    this.enemies.push(enemy);
  }

  checkDashCollision(enemy) {
    const collisionRadius = 100 * this.viewport.scaled;
    let player_pos = this.player.get_position()
    let enemy_pos = enemy.get_position()
    const dx = enemy_pos.x - player_pos.x;
    const dy = enemy_pos.y - player_pos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist <= collisionRadius && !enemy.hit) {
      enemy.health -= this.player.dash_damage;
      enemy.hit = true;
      if (enemy.health <= 0) {
        enemy.kill();
        this.player.dash_cancelable = true;
        this.player.oxygen = Math.min(this.player.oxygen + enemy.oxygen, this.player.max_oxygen)
      }
    }
  }
}
