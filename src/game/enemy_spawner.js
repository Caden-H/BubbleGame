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

      this.group_size = 10
      this.enemies_left_in_group = 0;
      this.group_angle = 0;

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

    this.handleEnemyCollisions();
  }

  spawnEnemy(damage, oxygen, health) {
    const spawnRadius = 2000;
  
    if (this.enemies_left_in_group <= 0) {
      this.group_angle = Math.random() * 2 * Math.PI;
      this.enemies_left_in_group = this.group_size;
    } else {
      this.enemies_left_in_group-= 1;
    }

    const angle = this.group_angle + Math.random() / 2;
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

  handleEnemyCollisions() {
    for (let i = 0; i < this.enemies.length; i++) {
      for (let j = i + 1; j < this.enemies.length; j++) {
        const enemyA = this.enemies[i];
        const enemyB = this.enemies[j];

        if (!enemyA.dead && !enemyB.dead) {
          const polygonA = enemyA.corners;
          const polygonB = enemyB.corners;
  
          const collision = polygonsIntersect(polygonA, polygonB);
  
          if (collision.intersect) {
            const mtv = { x: collision.axis.x * collision.overlap, y: collision.axis.y * collision.overlap };
            
            const move_max = 0.2
            const mtvLength = Math.sqrt(mtv.x * mtv.x + mtv.y * mtv.y);
            const clampedLength = Math.min(mtvLength, move_max);
            const scale = clampedLength / mtvLength;
            const moveX = mtv.x * scale;
            const moveY = mtv.y * scale;

            enemyA.sprite.x -= moveX / 2;
            enemyA.sprite.y -= moveY / 2;
            enemyB.sprite.x += moveX / 2;
            enemyB.sprite.y += moveY / 2;
          }
        }
      }
    }
  }
}

function projectPolygon(axis, polygon) {
  let min = axis.x * polygon[0].x + axis.y * polygon[0].y;
  let max = min;
  for (let i = 1; i < polygon.length; i++) {
      const projection = axis.x * polygon[i].x + axis.y * polygon[i].y;
      if (projection < min) min = projection;
      if (projection > max) max = projection;
  }
  return { min, max };
}

function polygonsIntersect(a, b) {
  const polygons = [a, b];
  let overlap = Infinity;
  let smallestAxis = null;

  for (let i = 0; i < polygons.length; i++) {
      const polygon = polygons[i];
      for (let i1 = 0; i1 < polygon.length; i1++) {
          const i2 = (i1 + 1) % polygon.length;
          const p1 = polygon[i1];
          const p2 = polygon[i2];

          const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
          const axis = { x: -edge.y, y: edge.x };
          const length = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
          axis.x /= length;
          axis.y /= length;

          const projectionA = projectPolygon(axis, a);
          const projectionB = projectPolygon(axis, b);

          if (projectionA.max < projectionB.min || projectionB.max < projectionA.min) {
              return { intersect: false, axis: null, overlap: 0 };
          } else {
              const currentOverlap = Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min);
              if (currentOverlap < overlap) {
                  overlap = currentOverlap;
                  smallestAxis = axis;
              }
          }
      }
  }
  return { intersect: true, axis: smallestAxis, overlap };
}