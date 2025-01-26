import * as PIXI from "pixi.js";

import EnemyParticle from "./enemy_particles";

var enemy_particles = [];

export class Enemy {
  constructor(texture, startX, startY, damage, oxygen, health, viewport) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.scale = 1;
    this.sprite.x = startX;
    this.sprite.y = startY;

    this.speed = 50; // per second
    this.oxygen = oxygen;
    this.damage = damage; // per second
    this.health = health;
    this.size_constant = 50;

    this.dead = false;
    this.hit = false;
    this.viewport = viewport;
  }

  get_position() {
    return this.sprite.getGlobalPosition()
  }

  update(delta, bubble) {
    if (this.dead) this.kill();

    let position = this.sprite.getGlobalPosition()

    const bubbleCenter = bubble.BubbleSprite.getGlobalPosition();
    const dx = bubbleCenter.x - position.x;
    const dy = bubbleCenter.y - position.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist > bubble.radius + this.size_constant) {
      const nx = dx / dist;
      const ny = dy / dist;

      const angle = Math.atan2(ny, nx);
      this.sprite.rotation = angle + Math.PI / 2;
      
      this.sprite.x += nx * this.speed * delta.elapsedMS / 1000;
      this.sprite.y += ny * this.speed * delta.elapsedMS / 1000;
    }

    if (dist <= bubble.radius + this.size_constant) {
      bubble.change_oxygen(Math.min(-this.damage * delta.elapsedMS / 1000 - bubble.defense, 0));
    }

    // run update() on all particles
    for (let i = enemy_particles.length - 1; i >= 0; i--) {
      const particle = enemy_particles[i];
      particle.update(delta);
      if (particle.lifetime <= 0) {
        enemy_particles.splice(i, 1);
      }
    }
  }

  kill() {
    // // create 10-20 particles from EnemyParticle
    if (this.dead) return;

    let tempx = this.sprite.x;
    let tempy = this.sprite.y;
    for (let i = 0; i < Math.random() * 50 + 50; i++) {
      let particle = new EnemyParticle(this.viewport, tempx, tempy);
      enemy_particles.push(particle);
    }

    this.dead = true;
    this.sprite.destroy();

  }
}
