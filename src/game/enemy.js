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

    this.speed = 100; // per second
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

    const position = this.get_position()
    const bubbleCenter = bubble.get_position();
    const dx = bubbleCenter.x - position.x;
    const dy = bubbleCenter.y - position.y;
    const dist = bubble.distance_from_center(position.x, position.y)
    
    const aheadX = position.x + Math.cos(this.sprite.rotation - Math.PI / 2) * 70 * this.viewport.scaled;
    const aheadY = position.y + Math.sin(this.sprite.rotation - Math.PI / 2) * 70 * this.viewport.scaled;

    const radius = bubble.radius
    let head_dist = bubble.distance_from_center(aheadX, aheadY)
    
    const nx = dx / dist;
    const ny = dy / dist;

    const angle = Math.atan2(ny, nx);
    this.sprite.rotation = angle + Math.PI / 2;
    

    if (head_dist > radius) {
      this.sprite.x += nx * this.speed * delta.elapsedMS / 1000;
      this.sprite.y += ny * this.speed * delta.elapsedMS / 1000;
    }
    head_dist = bubble.distance_from_center(aheadX, aheadY)

    if (head_dist <= radius) {
      bubble.change_oxygen(Math.min((bubble.defense-this.damage) * delta.elapsedMS / 1000, 0));

      if (head_dist < radius) {
        this.sprite.x -= nx * Math.min(this.speed, radius - head_dist) * delta.elapsedMS / 1000;
        this.sprite.y -= ny * Math.min(this.speed, radius - head_dist) * delta.elapsedMS / 1000;
      }
    }

    // run update() on all particles
    for (let i = enemy_particles.length - 1; i >= 0; i--) {
      const particle = enemy_particles[i];
      particle.update(delta);
      if (particle.lifetime <= 0) {
        enemy_particles.splice(i, 1);
      }
    }
    this.getCorners()
  }

  getCorners() {
    const { x, y } = this.get_position();
    const rotation = this.sprite.rotation;

    const hw = this.sprite.width * this.viewport.scaled / 2;
    const hh = this.sprite.height * this.viewport.scaled / 2;

    const corners = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh },
    ];

    this.corners = corners.map(corner => {
        const rotatedX = corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation) + x;
        const rotatedY = corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation) + y;
        return { x: rotatedX, y: rotatedY };
    });
  }

  kill() {
    // // create 10-20 particles from EnemyParticle
    if (this.dead) return;

    let tempx = this.sprite.x;
    let tempy = this.sprite.y;
    for (let i = 0; i < Math.random() * 10 + 10; i++) {
      let particle = new EnemyParticle(this.viewport, tempx, tempy);
      enemy_particles.push(particle);
    }

    this.dead = true;
    this.sprite.destroy();

  }
}
