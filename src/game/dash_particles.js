import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";

class DashParticle {
    constructor(viewport, startx, starty, lightness) {

        this.sprite = new PIXI.Graphics();
        this.viewport = viewport;

        this.startx = startx + Math.random() * 10 - 5;
        this.starty = starty + Math.random() * 10 - 5;

        // big bubble color: #ADD8E6
        //#a3ddff
        this.sprite.fill(0xADD8E6);
        this.sprite.circle(this.startx, this.starty, 3);
        this.sprite.fill();
        this.viewport.addChild(this.sprite);
        // choose a random direction for the particle to move in
        this.dx = Math.random() * 2 - 1;
        this.dy = Math.random() * 2 - 1;

        this.maxLifetime = 60;
        this.lifetime = this.maxLifetime;

        this.lightness = lightness;
        this.sprite.alpha = this.lightness;

    }


    update(delta) {

        this.sprite.alpha = this.lifetime/this.maxLifetime * (this.lightness * 3);
        this.sprite.x += this.dx * delta.deltaTime;
        this.sprite.y += this.dy * delta.deltaTime;

        this.lifetime -= delta.deltaTime;
        // if the particle has faded out, destroy it
        if (this.lifetime <= 0) {
            this.sprite.destroy();
        }

        
    }

}

export default DashParticle;