export class Bubble {
  constructor(BubbleSprite) {
    this.BubbleSprite = BubbleSprite;
    this.oxygen = 100;
    this.oxygen_rate = 0.1;
    this.base_radius = 10
    this.radius = 10;
  }

  get_position() {
    return this.BubbleSprite.getGlobalPosition();
  }

  contains(x, y) {
    const bubbleCenter = this.BubbleSprite.getGlobalPosition();
    const dx = x - bubbleCenter.x;
    const dy = y - bubbleCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= this.radius;
  }

  grow(delta) {
    this.change_oxygen(this.oxygen_rate * delta.deltaTime);
  }

  change_oxygen(amount) {
    this.oxygen += amount;
    this.BubbleSprite.scale = Math.sqrt(this.oxygen)
    this.radius = this.base_radius * Math.sqrt(this.oxygen)
  }
}
