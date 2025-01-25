export class Bubble {
  constructor(BubbleSprite) {
    this.BubbleSprite = BubbleSprite;
    this.reset()
  }

  reset() {
    this.BubbleSprite.x = 0;
    this.BubbleSprite.y = 0;
    this.oxygen = 100;
    this.oxygen_rate = 5; // per seconds
    this.base_radius = 10
    this.radius = 10;
    this.defense = 0;
    this.scale_constant = 1/8;
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
    this.change_oxygen(this.oxygen_rate * delta.elapsedMS / 1000);
  }

  change_oxygen(amount) {
    this.oxygen += amount;
    this.BubbleSprite.scale = Math.sqrt(this.oxygen+30) * this.scale_constant
    this.radius = this.base_radius * Math.sqrt(this.oxygen+30)
  }
}
