import * as PIXI from "pixi.js";

export class Enemy {
  constructor(texture, startX, startY, damage, oxygen, health) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.scale = 0.1;
    this.sprite.x = startX;
    this.sprite.y = startY;

    this.speed = 50; // per second
    this.oxygen = oxygen;
    this.damage = damage; // per second
    this.health = health;

    this.dead = false;
  }

  get_position() {
    return this.sprite.getGlobalPosition()
  }

  update(delta, bubble) {
    if (this.dead) return;

    let position = this.sprite.getGlobalPosition()

    const bubbleCenter = bubble.BubbleSprite.getGlobalPosition();
    const dx = bubbleCenter.x - position.x;
    const dy = bubbleCenter.y - position.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist > bubble.radius) {
      const nx = dx / dist;
      const ny = dy / dist;

      const angle = Math.atan2(ny, nx);
      this.sprite.rotation = angle + Math.PI;
      
      this.sprite.x += nx * this.speed * delta.elapsedMS / 1000;
      this.sprite.y += ny * this.speed * delta.elapsedMS / 1000;
    }

    if (dist <= bubble.radius) {
      bubble.change_oxygen(Math.min(-this.damage * delta.elapsedMS / 1000 - bubble.defense, 0));
    }
  }
}
