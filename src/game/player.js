
export class Player {
  constructor(PlayerSprite) {
    this.PlayerSprite = PlayerSprite;
    this.PlayerSprite.scale = 0.1;
    this.reset()

  }

  reset() {
    this.PlayerSprite.x = 0;
    this.PlayerSprite.y = 0;

    this.bubble_speed = 300; // per second
    this.water_speed = 60; // per second

    this.in_bubble = true;

    this.dx = 0;
    this.dy = 0;

    this.dash_length = 150;
    this.dash_cooldown = 1/2; // seconds
    this.dash_cost = 1;

    this.dash_speed = (2 * this.dash_length) / this.dash_cooldown;
    this.current_dash_cooldown = 0
    this.dashing = false;
    this.dash_dir_x = 0;
    this.dash_dir_y = 0;

    this.oxygen = 10;
    this.max_oxygen = 20;
    this.oxygen_transfer_rate = 1; // per second
    this.oxygen_use_rate = 2; // per second
  }

  get_position() {
    return this.PlayerSprite.getGlobalPosition()
  }

  move(delta, keys, mousePos, player_in_bubble) {
    let speed = 0;
    this.in_bubble = player_in_bubble;
    if (player_in_bubble) {
      speed = this.bubble_speed;
    } else {
      speed = this.water_speed
    }
    if (this.dashing == false) {
      this.dx = 0;
      this.dy = 0;
      
      if (keys["w"]) {
        this.dy = -1;
      }
      if (keys["s"]) {
        this.dy = +1;
      }
      if (keys["a"] ) {
        this.dx = -1;
      }
      if (keys["d"]) {
        this.dx = +1;
      }

      if (this.dx !== 0 || this.dy !== 0) {
        const mag = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        this.dx /= mag;
        this.dy /= mag;
      }

      this.PlayerSprite.x += this.dx * speed * delta.deltaTime / 60;
      this.PlayerSprite.y += this.dy * speed * delta.deltaTime / 60;

      if (this.dx !== 0 || this.dy !== 0) {
        const angle = Math.atan2(this.dy, this.dx);
        this.PlayerSprite.rotation = angle - Math.PI / 2;
      }

      if (keys[" "]) {
        this.startDash(mousePos);
      }
    }
    else {
      this.updateDash(delta);
    }
  }

  startDash(mousePos) {
    this.dashing = true;
    this.current_dash_cooldown = this.dash_cooldown;
    this.oxygen -= this.dash_cost;

    const playerPos = this.PlayerSprite.getGlobalPosition();
    let dx = mousePos.x - playerPos.x;
    let dy = mousePos.y - playerPos.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 0) {
      dx /= mag;
      dy /= mag;
    }

    this.dash_dir_x = dx;
    this.dash_dir_y = dy;

    this.PlayerSprite.rotation = Math.atan2(dy, dx) - Math.PI / 2;
  }

  updateDash(delta) {
    const fraction = this.current_dash_cooldown / this.dash_cooldown;
    const currentSpeed = this.dash_speed * fraction;

    this.PlayerSprite.x += this.dash_dir_x * currentSpeed * delta.deltaTime / 60;
    this.PlayerSprite.y += this.dash_dir_y * currentSpeed * delta.deltaTime / 60;

    this.current_dash_cooldown -= delta.deltaTime / 60;

    if (this.current_dash_cooldown <= 0) {
      this.dashing = false;
      this.current_dash_cooldown = 0;
    }
  }

  updateOxygen(delta, bubble) {
    let amount = 0;
    if (this.in_bubble) {
      if (this.oxygen > this.max_oxygen / 2) {
        amount = Math.min(this.oxygen - this.max_oxygen / 2, delta.deltaTime / 60 * this.oxygen_transfer_rate)
        this.oxygen -= amount;
        bubble.change_oxygen(amount);
      } else if (this.oxygen < this.max_oxygen / 2) {
        amount = Math.min(this.max_oxygen / 2 - this.oxygen, delta.deltaTime / 60 * this.oxygen_transfer_rate)
        this.oxygen += amount;
        bubble.change_oxygen(-amount);
      }
    } else {
      this.oxygen -= delta.deltaTime / 60 * this.oxygen_use_rate;
    }
  }
}