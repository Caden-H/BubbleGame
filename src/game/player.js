import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";
import DashParticle from "./dash_particles";

export class Player {
  constructor(PlayerSprite, viewport) {
    this.PlayerSprite = PlayerSprite;
    this.PlayerSprite.scale = 0.1;
    this.reset();
    this.viewport = viewport;
    this.particles = [];
  }

  reset() {
    this.PlayerSprite.x = 0;
    this.PlayerSprite.y = 0;

    this.bubble_speed = 500; // per second
    this.water_speed = 200;   // per second

    this.in_bubble = true;

    this.dx_key = 0;
    this.dx_conch = 0;
    this.dy_key = 0;
    this.dy_conch = 0;

    this.dash_length = 150;
    this.dash_cooldown = 0.5; // seconds
    this.dash_cost = 1;
    this.dash_damage = 1;

    this.dash_speed = (2 * this.dash_length) / this.dash_cooldown;
    this.current_dash_cooldown = 0;
    this.dashing = false;
    this.dash_cancelable = false;
    this.released_space = false;
    this.released_mouse = false;
    this.released_controller = false;
    this.dash_dir_x = 0;
    this.dash_dir_y = 0;

    this.oxygen = 10;
    this.max_oxygen = 20;
    this.oxygen_transfer_rate = 1; // per second
    this.oxygen_use_rate = 2;     // per second
  }

  get_position() {
    return this.PlayerSprite.getGlobalPosition();
  }

  move(delta, keys, mousePos, player_in_bubble) {
    // Decide movement speed
    this.in_bubble = player_in_bubble;
    const speed = this.in_bubble ? this.bubble_speed : this.water_speed;

    // If we're not in a dash or it's cancelable, we can move normally
    if (!this.dashing || this.dash_cancelable) {
      // Reset dx, dy
      this.dx_key = 0;
      this.dx_conch = 0;
      this.dy_key = 0;
      this.dy_conch = 0;

      // Keyboard
      if (keys["w"]) this.dy_key = -1;
      if (keys["s"]) this.dy_key = +1;
      if (keys["a"]) this.dx_key = -1;
      if (keys["d"]) this.dx_key = +1;
      
      // Normalize (dx, dy) for keys if we have any movement
      if (this.dx_key !== 0 || this.dy_key !== 0) {
        const mag = Math.sqrt(this.dx_key * this.dx_key + this.dy_key * this.dy_key);
        this.dx_key /= mag;
        this.dy_key /= mag;
      }

      // Controller left stick
      const gpX = keys.gpX || 0;
      const gpY = keys.gpY || 0;
      this.dx_conch += gpX;
      this.dy_conch += gpY;

      // Normalize (dx, dy) for conch if we have any movement
      if (this.dx_conch !== 0 || this.dy_conch !== 0) {
        const mag = Math.sqrt(this.dx_conch * this.dx_conch + this.dy_conch * this.dy_conch);
        this.dx_conch /= mag;
        this.dy_conch /= mag;
      }

      // Apply movement
      if (this.dx_conch != 0 || this.dy_conch != 0) {
        this.PlayerSprite.x += this.dx_conch * speed * delta.elapsedMS / 1000;
        this.PlayerSprite.y += this.dy_conch * speed * delta.elapsedMS / 1000;

      } else {
        this.PlayerSprite.x += this.dx_key * speed * delta.elapsedMS / 1000;
        this.PlayerSprite.y += this.dy_key * speed * delta.elapsedMS / 1000;
      }

      // === Rotation (facing) ===
      // If the right stick is tilted, face that direction. 
      // Otherwise, if left stick is moving, face movement direction.
      const rx = keys.gpRX || 0;
      const ry = keys.gpRY || 0;
      const magR = Math.sqrt(rx * rx + ry * ry);

      if (magR > 0.01) {
        // Right stick aiming
        this.PlayerSprite.rotation = Math.atan2(ry, rx) - Math.PI / 2;
      } else if (!this.dashing && (this.dx_conch !== 0 || this.dy_conch !== 0)) {
        // Face direction of conch movement
        const angle = Math.atan2(this.dy_conch, this.dx_conch);
        this.PlayerSprite.rotation = angle - Math.PI / 2;
      } else if (!this.dashing && (this.dx_key !== 0 || this.dy_key !== 0)) {
        // Face direction of key movement
        const angle = Math.atan2(this.dy_key, this.dx_key);
        this.PlayerSprite.rotation = angle - Math.PI / 2;
      }

      // === Dash Input Check ===
      // If not pressing dash, record that space was released
      if (!keys[" "]) {
        this.released_space = true;
      }
      if (!keys["controller_dash"]) {
        this.released_controller = true;
      }
      if (!keys["mouse_dash"]) {
        this.released_mouse = true;
      }

      // If dash (space/trigger/mouse) is pressed and was previously released
      if ((keys[" "]) &&
        ((this.released_space && this.dash_cancelable) ||
        !this.dash_cancelable)) {
          this.released_space = false;
          this.startDash(mousePos, keys);
        } else if ((keys["controller_dash"]) &&
        ((this.released_controller && this.dash_cancelable) ||
        !this.dash_cancelable)) {
          this.released_controller = false;
          this.startDash(mousePos, keys);
        } else if ((keys["mouse_dash"]) &&
        ((this.released_mouse && this.dash_cancelable) ||
        !this.dash_cancelable)
      ) {
        this.released_mouse = false;
        this.startDash(mousePos, keys);
      } else if (this.dashing) {
        this.updateDash(delta);
      }
    } else {
      this.updateDash(delta)
    }
  }

  startDash(mousePos, keys) {
    this.dashing = true;
    this.current_dash_cooldown = this.dash_cooldown;

    // Oxygen cost
    if (this.dash_cancelable) {
      this.oxygen -= this.dash_cost / 2;
    } else {
      this.oxygen -= this.dash_cost;
    }
    this.dash_cancelable = false;

    // Decide dash direction:
    // 1) If right stick is tilted, dash that direction.
    // 2) Else if left stick is moving, dash that direction.
    // 3) Else fallback to mouse.
    const rx = keys.gpRX || 0;
    const ry = keys.gpRY || 0;
    const magR = Math.sqrt(rx * rx + ry * ry);

    let dashX = 0;
    let dashY = 0;
    if (magR > 0.01) {
      // Right stick dash
      dashX = rx / magR;
      dashY = ry / magR;
    } else {
      // If there's a movement vector from left stick
      const moveMag = Math.sqrt(this.dx_conch * this.dx_conch + this.dy_conch * this.dy_conch);
      if (moveMag > 0.01) {
        // Dash in the direction we're moving/facing
        dashX = this.dx_conch;
        dashY = this.dy_conch;
      } else {
        // Fallback to mouse aim
        // (Remove this if you want 100% ignore of mouse when a controller is connected)
        const playerPos = this.PlayerSprite.getGlobalPosition();
        dashX = mousePos.x - playerPos.x;
        dashY = mousePos.y - playerPos.y;
        const magM = Math.sqrt(dashX * dashX + dashY * dashY);
        if (magM > 0) {
          dashX /= magM;
          dashY /= magM;
        }
      }
    }

    this.dash_dir_x = dashX;
    this.dash_dir_y = dashY;

    // Rotate sprite to dash direction
    this.PlayerSprite.rotation = Math.atan2(dashY, dashX) - Math.PI / 2;
  }

  updateDash(delta) {
    // Fraction of dash cooldown left
    const fraction = this.current_dash_cooldown / this.dash_cooldown;
    const currentSpeed = this.dash_speed * fraction;

    // Move player
    this.PlayerSprite.x += this.dash_dir_x * currentSpeed * delta.elapsedMS / 1000;
    this.PlayerSprite.y += this.dash_dir_y * currentSpeed * delta.elapsedMS / 1000;

    this.generateDashParticles();

    // Decrease cooldown
    this.current_dash_cooldown -= delta.elapsedMS / 1000;
    if (this.current_dash_cooldown <= 0) {
      this.dashing = false;
      this.dash_cancelable = false;
      this.current_dash_cooldown = 0;
    }
  }

  updateOxygen(delta, bubble) {
    let amount = 0;
    if (this.in_bubble) {
      if (this.oxygen > this.max_oxygen / 2) {
        amount = Math.min(
          this.oxygen - this.max_oxygen / 2,
          (delta.elapsedMS / 1000) * this.oxygen_transfer_rate
        );
        this.oxygen -= amount;
        bubble.change_oxygen(amount);
      } else if (this.oxygen < this.max_oxygen / 2) {
        amount = Math.min(
          this.max_oxygen / 2 - this.oxygen,
          (delta.elapsedMS / 1000) * this.oxygen_transfer_rate
        );
        this.oxygen += amount;
        bubble.change_oxygen(-amount);
      }
    } else {
      this.oxygen -= delta.elapsedMS / 1000 * this.oxygen_use_rate;
    }
  }

  generateDashParticles() {
    let lightness = this.oxygen/this.max_oxygen;
    // let lightness be a chance that the particle isn't created
    if (Math.random() * 0.5 > lightness) return;
    const particle = new DashParticle(this.viewport, this.PlayerSprite.x, this.PlayerSprite.y, lightness);
    this.particles.push(particle);
  }

  updateParticles(delta) {
    this.particles = this.particles.filter((p) => p.lifetime > 0);
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update(delta);
    }
  }
}
