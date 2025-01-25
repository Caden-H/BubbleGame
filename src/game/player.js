
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
    this.dash_damage = 1;

    this.dash_speed = (2 * this.dash_length) / this.dash_cooldown;
    this.current_dash_cooldown = 0
    this.dashing = false;
    this.dash_cancelable = false;
    this.released_space = false;
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
    if (this.dashing == false || this.dash_cancelable) {
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

      if (!keys[" "]) {
        this.released_space = true
      }
      if ((keys[" "] && this.released_space && this.dash_cancelable) || (keys[" "] && !this.dash_cancelable)) {
        this.startDash(mousePos);
      } else if (this.dashing) {
        this.updateDash(delta)
      }
    }
    else {
      this.updateDash(delta);
    }
  }

  startDash(mousePos) {
    // Set the player to dashing state
    this.dashing = true;
    // Reset the space key release flag
    this.released_space = false;
    // Set the dash cooldown timer
    this.current_dash_cooldown = this.dash_cooldown;
    
    // Reduce oxygen based on whether the dash is cancelable
    if (this.dash_cancelable) {
      this.oxygen -= this.dash_cost / 2;
    } else {
      this.oxygen -= this.dash_cost;
    }
    
    // Dash is not cancelable during the dash
    this.dash_cancelable = false;

    // Calculate the direction of the dash based on the mouse position
    const playerPos = this.PlayerSprite.getGlobalPosition();
    let dx = mousePos.x - playerPos.x;
    let dy = mousePos.y - playerPos.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 0) {
      dx /= mag;
      dy /= mag;
    }

    // Set the dash direction
    this.dash_dir_x = dx;
    this.dash_dir_y = dy;

    // Rotate the player sprite to face the dash direction
    this.PlayerSprite.rotation = Math.atan2(dy, dx) - Math.PI / 2;
    }

  updateDash(delta) {
    // Calculate the fraction of the dash cooldown remaining
    const fraction = this.current_dash_cooldown / this.dash_cooldown;
    // Calculate the current speed based on the fraction of the cooldown remaining
    const currentSpeed = this.dash_speed * fraction;

    // Update the player's position based on the dash direction and current speed
    this.PlayerSprite.x += this.dash_dir_x * currentSpeed * delta.deltaTime / 60;
    this.PlayerSprite.y += this.dash_dir_y * currentSpeed * delta.deltaTime / 60;

    // Decrease the dash cooldown timer
    this.current_dash_cooldown -= delta.deltaTime / 60;

    // Check if the dash cooldown has finished
    if (this.current_dash_cooldown <= 0) {
      // End the dash
      this.dashing = false;
      // Reset the dash cancelable flag
      this.dash_cancelable = false;
      // Ensure the cooldown timer is reset to 0
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