export class Bubble {
  constructor(BubbleSprite) {
    this.BubbleSprite = BubbleSprite;
    this.x = 0;
    this.y = 0;
  }

  setScale(size) {
    this.BubbleSprite.scale = size;
  }
}
