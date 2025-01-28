import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";
import DashParticle from "./dash_particles";

export class Player {
  constructor(PlayerSprite, ArmSprite, viewport) {
    this.PlayerSprite = PlayerSprite;
    this.PlayerSprite.scale = 0.2;
    this.ArmSprite = ArmSprite;
    this.ArmSprite.scale = 0.2;
    this.reset();
    this.viewport = viewport;
    this.particles = [];
    this.using_gamepad = false;

    this.dash_audios = [];
    for (let i = 1; i <= 4; i++) {
      const dashAud = new Audio(`raw-assets/audio/dash${i}.wav`);
      dashAud.volume = 0.1;
      this.dash_audios.push(dashAud);
    }
    this.combo_audios = [];
    for (let i = 1; i <= 4; i++) {
      const comboAud = new Audio(`raw-assets/audio/combo${i}.wav`);
      comboAud.volume = 1;
      this.combo_audios.push(comboAud);
    }
  }

  reset() {
    this.PlayerSprite.x = 0;
    this.PlayerSprite.y = 0;

    this.ArmSprite.x = 0;
    this.ArmSprite.y = 0;

    this.in_bubble = true;

    this.dx_key = 0;
    this.dx_conch = 0;
    this.dy_key = 0;
    this.dy_conch = 0;

    this.dash_length = 200;
    this.dash_cooldown = 0.5; // seconds
    this.dash_cost = 1;
    this.dash_damage = 1;
    this.dash_combo = 0;

    this.current_dash_cooldown = 0;
    this.dashing = false;
    this.dash_cancelable = false;
    this.released_space = false;
    this.released_mouse = false;
    this.released_controller = false;
    this.dash_dir_x = 0;
    this.dash_dir_y = 0;
    this.let_hold_dash_cancel = false;

    this.oxygen = 10;
    this.max_oxygen = 20;
    this.oxygen_transfer_rate = 1; // per second
    this.oxygen_use_rate = 2;     // per second

    this.bubble_speed = 500; // per second
    this.water_speed = 200;   // per second
    this.momentum_x = 0;
    this.momentum_y = 0;
    this.max_water_speed = 10 * this.water_speed; // Maximum speed when in water
    this.m_dash_constant = 2;
    this.friction = 10;
    this.dash_friction = 0;
    this.post_dash_friction = this.dash_length * 3/8;
    this.bubble_friction = 200;
  }

  update(delta, keys, mousePos, bubble, inBubble) {
    this.move(delta, keys, mousePos, inBubble);
    this.handle_momentum(delta);
    this.updateSprite(keys, mousePos);
    this.updateOxygen(delta, bubble);
    this.updateParticles(delta);
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

      let move_x = 0;
      let move_y = 0;
      // Apply movement
      if (this.dx_conch != 0 || this.dy_conch != 0) {
        this.using_gamepad = true;
        move_x = this.dx_conch * speed * delta.elapsedMS / 1000;
        move_y = this.dy_conch * speed * delta.elapsedMS / 1000;

      } else if (this.dx_key != 0 || this.dy_key != 0){
        this.using_gamepad = false;
        move_x = this.dx_key * speed * delta.elapsedMS / 1000;
        move_y = this.dy_key * speed * delta.elapsedMS / 1000;
      }
      
      if (this.in_bubble) {
        this.PlayerSprite.x += move_x
        this.PlayerSprite.y += move_y
      } else {
        this.momentum_x += move_x
        this.momentum_y += move_y
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
        (this.let_hold_dash_cancel && this.dash_cancelable) ||
        !this.dash_cancelable)) {
          this.using_gamepad = false;
          this.released_space = false;
          this.startDash(mousePos, keys);
        } else if ((keys["controller_dash"]) &&
        ((this.released_controller && this.dash_cancelable) ||
        (this.let_hold_dash_cancel && this.dash_cancelable) ||
        !this.dash_cancelable)) {
          this.using_gamepad = true;
          this.released_controller = false;
          this.startDash(mousePos, keys);
        } else if ((keys["mouse_dash"]) &&
        ((this.released_mouse && this.dash_cancelable) ||
        (this.let_hold_dash_cancel && this.dash_cancelable) ||
        !this.dash_cancelable)
      ) {
        this.using_gamepad = false;
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
    if (this.dashing) {
      this.dash_combo += 1;
    } else {
      this.dash_combo = 0;
    }
    if (this.dash_combo == 0 ) {
      const randomIndex = Math.floor(Math.random() * this.dash_audios.length);
      const randomAudio = this.dash_audios[randomIndex];
      randomAudio.currentTime = 0;
      randomAudio.play();
    }
    // } else if (this.dash_combo > 0 ) {
    //   const comboIndex = Math.min(this.dash_combo - 1, 3);
    //   const comboAudio = this.combo_audios[comboIndex];
    //   comboAudio.currentTime = 0;
    //   comboAudio.play();
    // }

    this.dashing = true;
    this.current_dash_cooldown = this.dash_cooldown;

    // Oxygen cost
    if (this.dash_cancelable) {
      this.oxygen = Math.max(this.oxygen - this.dash_cost / 2, 0);
    } else {
      this.oxygen = Math.max(this.oxygen - this.dash_cost, 0);
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
      } else if (!this.using_gamepad) {
        // Fallback to mouse aim
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

    const mag = Math.sqrt(this.momentum_x ** 2 + this.momentum_y ** 2)
    this.momentum_x = mag * this.dash_dir_x
    this.momentum_y = mag * this.dash_dir_y
  }

  updateDash(delta) {
    const fraction = Math.max(this.current_dash_cooldown / (this.dash_cooldown / 2) - 1, 0);
    
    const dash_speed = (2 * this.dash_length) / (this.dash_cooldown / 2);
    const currentSpeed = dash_speed * fraction;
    const move_x = this.dash_dir_x * currentSpeed * delta.elapsedMS / 1000;
    const move_y = this.dash_dir_y * currentSpeed * delta.elapsedMS / 1000;

    // Move player
    if (this.in_bubble) {
      this.PlayerSprite.x += move_x;
      this.PlayerSprite.y += move_y;
    } else {
      this.momentum_x += move_x * this.m_dash_constant;
      this.momentum_y += move_y * this.m_dash_constant;
    }

    this.generateDashParticles();

    // Decrease cooldown
    this.current_dash_cooldown -= delta.elapsedMS / 1000;
    if (this.current_dash_cooldown <= 0) {
      this.dashing = false;
      this.dash_cancelable = false;
      this.current_dash_cooldown = 0;
    }
  }

  handle_momentum(delta) {
    let friction = this.friction
    if (this.in_bubble) {
      friction = this.bubble_friction
    } else if (this.current_dash_cooldown >= this.dash_cooldown / 2) {
      friction = this.dash_friction
    } else if (this.dashing) {
      friction = this.post_dash_friction;
    }
    const mx = Math.max(Math.abs(this.momentum_x) - Math.sqrt(Math.abs(this.momentum_x)) * friction * delta.elapsedMS / 1000, 0)
    const my = Math.max(Math.abs(this.momentum_y) - Math.sqrt(Math.abs(this.momentum_y)) * friction * delta.elapsedMS / 1000, 0)
    let mag = Math.sqrt(mx * mx + my * my)
    if (mag < 1) {mag = 1}
    this.momentum_x = Math.sign(this.momentum_x) * Math.min(mx, mx / mag * this.max_water_speed)
    this.momentum_y = Math.sign(this.momentum_y) * Math.min(my, my / mag * this.max_water_speed)
    console.log(this.momentum_x, this.momentum_y)
    this.PlayerSprite.x += this.momentum_x * delta.elapsedMS / 1000;
    this.PlayerSprite.y += this.momentum_y * delta.elapsedMS / 1000;
  }

  updateSprite(keys, mousePos) {
    this.ArmSprite.x = this.PlayerSprite.x
    this.ArmSprite.y = this.PlayerSprite.y

    const rx = keys.gpRX || 0;
    const ry = keys.gpRY || 0;

    if (this.in_bubble) {
      if (!this.dashing) {
        if (this.dx_conch !== 0 || this.dy_conch !== 0) {
          // Face direction of conch movement
          const angle = Math.atan2(this.dy_conch, this.dx_conch);
          this.PlayerSprite.rotation = angle + Math.PI / 2;
        } else if (this.dx_key !== 0 || this.dy_key !== 0) {
          // Face direction of key movement
          const angle = Math.atan2(this.dy_key, this.dx_key);
          this.PlayerSprite.rotation = angle + Math.PI / 2;
        }
      } else {
        this.PlayerSprite.rotation = Math.atan2(this.dash_dir_y, this.dash_dir_x) + Math.PI / 2;
      }
    } else {
      const angle = Math.atan2(this.momentum_y, this.momentum_x);
      this.PlayerSprite.rotation = angle + Math.PI / 2;
    }
    const magR = Math.sqrt(rx * rx + ry * ry);
    if (magR > 0.01) {
      // Right stick aiming
      this.ArmSprite.rotation = Math.atan2(ry, rx) + Math.PI / 2;
    } else if (this.dx_conch !== 0 || this.dy_conch !== 0){
      // Left stick aiming
      this.ArmSprite.rotation = Math.atan2(this.dy_conch, this.dx_conch) + Math.PI / 2;
    } else if (!this.using_gamepad) {
      // Fallback to mouse aim
      const playerPos = this.PlayerSprite.getGlobalPosition();
      const mx = mousePos.x - playerPos.x;
      const my = mousePos.y - playerPos.y;
      const magM = Math.sqrt(mx * mx + my * my);
      if (magM > 0) {
        this.ArmSprite.rotation = Math.atan2(my, mx) + Math.PI / 2;
      }
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
