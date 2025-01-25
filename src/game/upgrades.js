import * as PIXI from "pixi.js";

/**
 * An Upgrade object describes a single upgrade: name, cost scaling,
 * how to apply it, etc.
 */
class Upgrade {
  constructor(name, description, baseCost, onApply) {
    this.name = name;
    this.description = description;
    this.baseCost = baseCost;
    this.purchaseCount = 0;
    this.onApply = onApply;
  }

  get cost() {
    // cost = baseCost + (purchaseCount * baseCost)
    return this.baseCost + this.purchaseCount * this.baseCost;
  }

  buy(bubble, player) {
    bubble.oxygen -= this.cost;
    this.purchaseCount++;
    this.onApply(bubble, player);
  }
}

/**
 * UpgradeManager draws the brown station and handles the upgrade menu UI.
 * This version resets all upgrades on "reset()" while keeping your exact
 * "buttonBg.fill(...)" code & "new PIXI.Text({ text: ..., style: ... })" lines.
 */
export class UpgradeManager {
  constructor(app, bubble, player, sprite) {
    this.app = app;
    this.sprite = sprite;
    this.sprite.scale = 0.5;
    this.bubble = bubble;
    this.player = player;
    this.oxygen_ui = null;

    //////////////////////////////////////////////////////////////////
    // (1) STATION CONTAINER
    //////////////////////////////////////////////////////////////////
    this.stationContainer = new PIXI.Container();

    this.stationContainer.addChild(sprite);

    // Optional station label
    const stationStyle = new PIXI.TextStyle({
      fontSize: 24,
      fill: 0xD3D3D3,
    });
    const stationText = new PIXI.Text({ text: "B", style: stationStyle });
    stationText.anchor.set(0.5);
    stationText.x = 0;
    stationText.y = 0;
    this.stationContainer.addChild(stationText);

    // Position at bubble center
    this.stationContainer.x = bubble.BubbleSprite.x;
    this.stationContainer.y = bubble.BubbleSprite.y;

    //////////////////////////////////////////////////////////////////
    // (2) MENU CONTAINER
    //////////////////////////////////////////////////////////////////
    this.menuContainer = new PIXI.Container();
    this.menuContainer.visible = false;

    // Dark blue background
    const menuBg = new PIXI.Graphics();
    menuBg.fill(0x00008b);
    menuBg.rect(0, 0, 350, 400);
    menuBg.fill();
    this.menuContainer.addChild(menuBg);

    // Position near center of the screen
    this.menuContainer.x = this.app.renderer.width / 2 - 175; // half of 350
    this.menuContainer.y = this.app.renderer.height / 2 - 200; // half of 400

    // Title text
    const titleStyle = new PIXI.TextStyle({
      fontSize: 24,
      fill: 0xd3d3d3,
    });
    const title = new PIXI.Text({ text: "Upgrades", style: titleStyle });
    title.anchor.set(0.5, 0);
    title.x = 175;
    title.y = 10;
    this.menuContainer.addChild(title);

    // We'll store the upgrade buttons in an array
    this.upgradeButtons = [];

    // Close button
    const closeBtn = new PIXI.Container();
    closeBtn.x = 125;
    closeBtn.y = 350;
    closeBtn.interactive = true;
    closeBtn.buttonMode = true;

    const closeBg = new PIXI.Graphics();
    closeBg.fill(0x555555);
    closeBg.roundRect(0, 0, 80, 30, 5);
    closeBg.fill();
    closeBtn.addChild(closeBg);

    const closeTxtStyle = new PIXI.TextStyle({ fontSize: 16, fill: 0xd3d3d3 });
    const closeTxt = new PIXI.Text({ text: "Close (C)", style: closeTxtStyle });
    closeTxt.anchor.set(0.5);
    closeTxt.x = 40;
    closeTxt.y = 15;
    closeBtn.addChild(closeTxt);

    closeBtn.on("pointerdown", () => {
      this.closeMenu();
    });
    this.menuContainer.addChild(closeBtn);

    // Initialize + create buttons
    this._initUpgrades();      // sets this.upgrades array
    this._createUpgradeButtons(); // builds the actual UI
    this.active = false;       // used to track if we can open menu
  }

  //////////////////////////////////////////////////////////////////
  // (3) RESET: Clear existing buttons & create fresh upgrades
  //////////////////////////////////////////////////////////////////
  reset() {
    // 1) Remove old buttons
    for (const b of this.upgradeButtons) {
      this.menuContainer.removeChild(b.container);
    }
    this.upgradeButtons = [];

    // 2) Re-initialize the upgrades array
    this._initUpgrades();

    // 3) Rebuild the buttons in the menu
    this._createUpgradeButtons();
  }

  //////////////////////////////////////////////////////////////////
  // (4) Set up the base upgrades array
  //////////////////////////////////////////////////////////////////
  _initUpgrades() {
    this.upgrades = [
      new Upgrade("Higher Growth rate",   "Bubble grows faster over time", 100, (b, p) => { b.oxygen_rate += 2; }),
      new Upgrade("Better Defense",       "Reduces fish damage to bubble", 100, (b, p) => { b.defense += 2; }),
      new Upgrade("Faster O2 transfer",   "Player & bubble exchange O2 faster", 100, (b, p) => { p.oxygen_transfer_rate += 0.5; }),
      new Upgrade("Faster Speed in bubble","Player moves faster in bubble", 100, (b, p) => { p.bubble_speed += 120; }),
      new Upgrade("More Dash damage",     "Increases dash damage vs. enemies", 100, (b, p) => { p.dash_damage += 1; }),
      new Upgrade("Longer Dash distance", "Dash covers more ground",       100, (b, p) => { p.dash_length += 50; }),
      new Upgrade("Bigger Oxygen tank",   "Increase player's max oxygen",  100, (b, p) => { p.max_oxygen += 10; }),
      new Upgrade("Less O2 used per dash","Reduces oxygen dash cost",      100, (b, p) => { p.dash_cost = Math.max(0, p.dash_cost * 0.9); }),
    ];
  }

  //////////////////////////////////////////////////////////////////
  // (5) Create the upgrade button UI elements
  //////////////////////////////////////////////////////////////////
  _createUpgradeButtons() {
    let yOff = 60;
    for (const ug of this.upgrades) {
      const button = this._createUpgradeButton(ug);
      button.x = -10;
      button.y = yOff;
      yOff += 35;
      this.menuContainer.addChild(button);
      this.upgradeButtons.push({ container: button, upgrade: ug });
    }
  }

  /**
   * (6) Create a single upgrade button container
   * 
   * Here we preserve your EXACT lines for:
   *   buttonBg.beginFill(0x222288, 0.5) / buttonBg.drawRect(...) / buttonBg.endFill()
   *   new PIXI.Text(`${upgrade.name} (Cost: ${upgrade.cost})`, textStyle)
   */
  _createUpgradeButton(upgrade) {
    const container = new PIXI.Container();
    container.interactive = true;
    container.buttonMode = true;

    // Keep your EXACT background shape lines:
    const buttonBg = new PIXI.Graphics();
    const fstyle = new PIXI.toFillStyle(0x222288, 0.5);
    buttonBg.fill(fstyle);
    buttonBg.rect(0, 0, 370, 30);
    buttonBg.fill();
    container.addChild(buttonBg);

    // Keep your EXACT text creation lines:
    const textStyle = new PIXI.TextStyle({
      fontSize: 16,
      fill: 0xD3D3D3,
    });
    const text = new PIXI.Text({ text: `${upgrade.name} (Cost: ${upgrade.cost})`, style: textStyle });
    text.x = 60;
    text.y = 5;
    container.addChild(text);

    container.buttonBg = buttonBg;
    container.labelText = text;
    container.upgrade = upgrade;

    // Buying logic
    container.on("pointerdown", () => {
      const cost = container.upgrade.cost;
      if (this.bubble.oxygen >= cost) {
        container.upgrade.buy(this.bubble, this.player);
        if (this.oxygen_ui) {
          this.oxygen_ui.update(this.player, this.bubble);
        }
        // Update cost text
        container.labelText.text = `${container.upgrade.name} (Cost: ${container.upgrade.cost})`;
        // Re-check highlights
        for (const b of this.upgradeButtons) {
          this._highlightIfAffordable(b.container);
        }
      } else {
        console.log("Not enough bubble oxygen to buy upgrade!");
      }
    });

    this._highlightIfAffordable(container);

    return container;
  }

  /**
   * If the player can afford an upgrade, highlight that button.
   */
  _highlightIfAffordable(buttonContainer) {
    const cost = buttonContainer.upgrade.cost;
    if (this.bubble.oxygen >= cost) {
      buttonContainer.buttonBg.tint = 0x55ff55; // greenish highlight
    } else {
      buttonContainer.buttonBg.tint = 0xffffff;
    }
  }

  /**
   * Called every frame from your main game loop for proximity check, etc.
   */
  update(delta, keys, oxygen_ui) {
    if (!this.oxygen_ui) {
      this.oxygen_ui = oxygen_ui;
    }
    const player_pos = this.player.get_position();
    const station_pos = this.stationContainer.getGlobalPosition();
    const dx = player_pos.x - station_pos.x;
    const dy = player_pos.y - station_pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If the player is close & presses "b", open the menu
    if (dist < 40 && keys["b"]) {
      this.openMenu();
      this.active = false;
    } else if (dist > 40) {
      this.active = true;
    }
  }

  openMenu() {
    this.menuContainer.visible = true;
    // highlight on open
    for (const b of this.upgradeButtons) {
      this._highlightIfAffordable(b.container);
    }
    if (this.onOpen) this.onOpen();
  }

  closeMenu() {
    this.menuContainer.visible = false;
    if (this.onClose) this.onClose();
  }
}
