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
 * UpgradeManager draws the brown square station and handles the menu UI.
 */
export class UpgradeManager {
    constructor(app, bubble, player) {
        this.app = app;
        this.bubble = bubble;
        this.player = player;
        this.oxygen_ui;
    
        this.stationContainer = new PIXI.Container();
    
        const stationGraphic = new PIXI.Graphics();
        stationGraphic.fill(0x8B4513); 
        stationGraphic.rect(-15, -15, 30, 30);
        stationGraphic.fill();
    
        this.stationContainer.addChild(stationGraphic);
    
        const stationStyle = new PIXI.TextStyle({
          fontSize: 24,
          fill: 0xD3D3D3
        });
        const stationText = new PIXI.Text({text: "B", style: stationStyle});
        stationText.anchor.set(0.5);
        stationText.x = 0;
        stationText.y = 0;
    
        this.stationContainer.addChild(stationText);
    
        this.stationContainer.x = bubble.BubbleSprite.x;
        this.stationContainer.y = bubble.BubbleSprite.y;

    //////////////////////////////////////////
    // (2) MENU CONTAINER
    //////////////////////////////////////////
    this.menuContainer = new PIXI.Container();
    this.menuContainer.visible = false; 
    // A dark blue background
    const menuBg = new PIXI.Graphics();
    menuBg.fill(0x00008B); // dark blue
    menuBg.rect(0, 0, 350, 400);
    menuBg.fill();
    this.menuContainer.addChild(menuBg);

    // Position menu near screen center
    this.menuContainer.x = this.app.renderer.width / 2 - 200;
    this.menuContainer.y = this.app.renderer.height / 2 - 150;

    // Title text in light grey
    const titleStyle = new PIXI.TextStyle({
      fontSize: 24,
      fill: 0xD3D3D3
    });
    const title = new PIXI.Text({text: "Upgrades", style: titleStyle});
    title.anchor.set(0.5, 0);
    title.x = 180;
    title.y = 10;
    this.menuContainer.addChild(title);

    this.reset()

    // We'll create a "button" (container with background + text) for each upgrade
    let yOff = 60;
    this.upgradeButtons = [];
    for (let i = 0; i < this.upgrades.length; i++) {
      const ug = this.upgrades[i];
      const button = this._createUpgradeButton(ug);
      button.x = 20;
      button.y = yOff;
      yOff += 35;
      this.menuContainer.addChild(button);
      this.upgradeButtons.push({ container: button, upgrade: ug });
    }

    //////////////////////////////////////////
    // (4) CLOSE BUTTON
    //////////////////////////////////////////
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

    const closeTxtStyle = new PIXI.TextStyle({ fontSize: 16, fill: 0xD3D3D3 });
    const closeTxt = new PIXI.Text({text: "Close", style: closeTxtStyle});
    closeTxt.anchor.set(0.5);
    closeTxt.x = 40; 
    closeTxt.y = 15;
    closeBtn.addChild(closeTxt);

    closeBtn.on("pointerdown", () => {
      this.closeMenu();
    });
    this.menuContainer.addChild(closeBtn);
  }

  reset(){
    // could maybe leave out for rouge-lite? idk
    this.upgrades = [
        new Upgrade("Higher Growth rate",  "Bubble grows faster over time",  100, (b, p) => { b.oxygen_rate += 0.05; }),
        new Upgrade("Better Defense",      "Reduces fish damage to bubble",  100, (b, p) => { b.defense += 0.5; }),
        new Upgrade("Faster O2 transfer",  "Player & bubble exchange O2 faster", 100, (b, p) => { p.oxygen_transfer_rate += 0.5; }),
        new Upgrade("Faster Speed in bubble", "Player moves faster in bubble", 100, (b, p) => { p.bubble_speed += 120; }),
        new Upgrade("More Dash damage",    "Increases dash damage vs. enemies", 100, (b, p) => { p.dash_damage += 1; }),
        new Upgrade("Longer Dash distance","Dash covers more ground",       100, (b, p) => { p.dash_length += 50; }),
        new Upgrade("Bigger Oxygen tank",  "Increase player's max oxygen",  100, (b, p) => { p.max_oxygen += 10; }),
        new Upgrade("Less O2 used per dash","Reduces oxygen dash cost",     100, (b, p) => { p.dash_cost = Math.max(0, p.dash_cost * 0.9); }),
      ];
      this.active = false;
  }

  /**
   * Creates a container that has a background and text for a given upgrade.
   */
  _createUpgradeButton(upgrade) {
    const container = new PIXI.Container();
    container.interactive = true;
    container.buttonMode = true;

    // We'll store references so we can recolor them:
    const buttonBg = new PIXI.Graphics();
    const fstyle = new PIXI.toFillStyle(0x222288, 0.5);
    buttonBg.fill(fstyle);  // some bluish color
    buttonBg.rect(0, 0, 360, 30);
    buttonBg.fill();
    container.addChild(buttonBg);

    // Light grey text
    const textStyle = new PIXI.TextStyle({
      fontSize: 16,
      fill: 0xD3D3D3
    });
    const text = new PIXI.Text({text: `${upgrade.name} (Cost: ${upgrade.cost})`, style: textStyle});
    text.x = 10;
    text.y = 5;
    container.addChild(text);

    // We'll store references so we can highlight or update cost text
    container.buttonBg = buttonBg;
    container.labelText = text;
    container.upgrade = upgrade;

    // On click => if bubble.oxygen >= cost, buy & refresh the text
    container.on("pointerdown", () => {
      const cost = container.upgrade.cost;
      if (this.bubble.oxygen >= cost) {
        container.upgrade.buy(this.bubble, this.player);
        if (this.oxygen_ui) {
            this.oxygen_ui.update(this.player, this.bubble)
        }
        // Refresh text & re-check highlight
        container.labelText.text = `${container.upgrade.name} (Cost: ${container.upgrade.cost})`;
        for (const b of this.upgradeButtons) {
            this._highlightIfAffordable(b.container);
        }
      } else {
        console.log("Not enough bubble oxygen to buy upgrade!");
      }
    });

    return container;
  }

  /**
   * Each frame, we do a quick check:
   * If the player can afford an upgrade, highlight that button differently.
   */
  _highlightIfAffordable(buttonContainer) {
    const cost = buttonContainer.upgrade.cost;
    if (this.bubble.oxygen >= cost) {
        console.log('afford')
      // e.g. a greenish highlight
      buttonContainer.buttonBg.tint = 0x55ff55;
    } else {
      // normal
      buttonContainer.buttonBg.tint = 0xffffff;
    }
  }

  /** 
   * Called every frame in your game loop. 
   * We also do our station proximity check here.
   */
  update(delta, keys, oxygen_ui) {
    // Check if player is near the station
    if (!this.oxygen_ui) {this.oxygen_ui = oxygen_ui}
    const player_pos = this.player.get_position();
    const station_pos = this.stationContainer.getGlobalPosition();

    const dx = player_pos.x - station_pos.x;
    const dy = player_pos.y - station_pos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // If close, open menu if "active" is true
    if (dist < 40 && keys['b']) { // && this.active) {
      this.openMenu();
      this.active = false; 
    } 
    // If we move away far enough, rearm "active"
    else if (dist > 40) {
      this.active = true;
    }
  }

  openMenu() {
    this.menuContainer.visible = true;
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
