import * as PIXI from "pixi.js";

export class OxygenUI {
    constructor(app, screenWidth) {
        // player oxygen display
        const barContainer = new PIXI.Container();
        barContainer.x = 20;
        barContainer.y = 20;
        app.stage.addChild(barContainer);

        this.barWidth = 200;
        this.barHeight = 20;

        const barBg = new PIXI.Graphics();
        barBg.fill(0x000000); // black
        barBg.rect(0, 0, this.barWidth, this.barHeight);
        barBg.fill();
        barContainer.addChild(barBg);

        this.darkBar = new PIXI.Graphics();
        barContainer.addChild(this.darkBar);

        this.lightBar = new PIXI.Graphics();
        barContainer.addChild(this.lightBar);

        // bubble oxygen display
        const style = new PIXI.TextStyle({
          fontFamily: "Arial",
          fontSize: 24,
          fill: "#ffffff",
          stroke: "#000000",
        });
        this.bubbleO2Text = new PIXI.Text({text: "Oxygen: 100", style});
        this.bubbleO2Text.x = screenWidth - 200;
        this.bubbleO2Text.y = 20;
        app.stage.addChild(this.bubbleO2Text);
    }

    update(player, bubble) {
        this.darkBar.clear();
        this.lightBar.clear();
      
        let fraction = player.oxygen / player.max_oxygen;
        fraction = Math.max(0, Math.min(1, fraction));
      
        const fractionDark = Math.min(fraction, 0.5) / 0.5;
        const darkWidth = this.barWidth * fractionDark;
      
        if (darkWidth > 0) {
          this.darkBar.fill(0x00008B); // dark blue
          this.darkBar.rect(0, 0, darkWidth, this.barHeight);
          this.darkBar.fill();
        }
      
        if (fraction > 0.5) {
          const fractionLight = (fraction - 0.5) / 0.5;
          const lightWidth = this.barWidth * fractionLight;
      
          this.lightBar.fill(0xD3D3D3); // light grey
          this.lightBar.rect(0, 0, lightWidth, this.barHeight);
          this.lightBar.fill();
      
        }

        this.bubbleO2Text.text = `Oxygen: ${parseInt(bubble.oxygen.toFixed(1))}`;
    }
}