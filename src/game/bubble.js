import BubbleParticle from "./bubble_particle";


export class Bubble {
  constructor(BubbleSprite, viewport) {
    this.BubbleSprite = BubbleSprite;
    this.viewport = viewport;
    this.reset();
    this.bubble_particles = [];
  }

  reset() {
    this.BubbleSprite.x = 0;
    this.BubbleSprite.y = 0;
    this.oxygen = 100;
    this.oxygen_rate = 5; // per seconds
    this.base_radius = 10;
    this.radius = 10;
    this.defense = 0;
    this.scale_constant = 1/5;
  }

  get_position() {
    return this.BubbleSprite.getGlobalPosition();
  }

  contains(x, y) {
    const bubbleCenter = this.get_position();
    const dx = x - bubbleCenter.x;
    const dy = y - bubbleCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= this.radius;
  }

  distance_from_center(x, y) {
    const bubbleCenter = this.get_position();
    const dx = x - bubbleCenter.x;
    const dy = y - bubbleCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist;
  }

  update(delta) {
    this.change_oxygen((this.oxygen_rate * delta.elapsedMS) / 1000);

    // Update particles
    for (let i = this.bubble_particles.length - 1; i >= 0; i--) {
      const particle = this.bubble_particles[i];
      particle.update(delta);
      if (particle.lifetime <= 0) {
        this.bubble_particles.splice(i, 1);
      }
    }
  }

  change_oxygen(amount) {
    this.oxygen += amount;
    this.BubbleSprite.scale = Math.sqrt(this.oxygen + 8) * this.scale_constant;
    this.radius = this.BubbleSprite.height * this.viewport.scaled / 2;

    // if (amount > 0) {
    //   // create a bubble particle that floats outward from the middle of the bubble
    //   const particle = new BubbleParticle(this.viewport, 0, 0);
    //   this.bubble_particles.push(particle);

    // }
  }
}
