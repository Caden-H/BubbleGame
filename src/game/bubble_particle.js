import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";

class BubbleParticle {
    constructor(viewport, startx, starty) {

        this.sprite = new PIXI.Graphics();
        this.viewport = viewport;

        this.startx = startx + Math.random() * 10 - 5;
        this.starty = starty + Math.random() * 10 - 5;

        // big bubble color: #ADD8E6
        //#a3ddff
        this.sprite.circle(this.startx, this.starty, 3);
        this.sprite.fill(0xffffff);
        this.viewport.addChild(this.sprite);
        // choose a random direction for the particle to move in
        this.dx = Math.random() * 2 - 1;
        this.dy = Math.random() * 2 - 1;

        this.maxLifetime = 6000;
        this.lifetime = this.maxLifetime;
    

    }


    update(delta) {

        // this.sprite.alpha = this.lifetime/this.maxLifetime;
        const angle = Math.atan2(this.dy, this.dx);
        const speedFactor = this.speed * (this.lifetime / this.maxLifetime);
        this.sprite.x += Math.cos(angle) * delta.deltaTime * speedFactor;
        this.sprite.y += Math.sin(angle) * delta.deltaTime * speedFactor;
        console.log(this.sprite.x, this.sprite.y);

        this.lifetime -= delta.deltaTime;
        // if the particle has faded out, destroy it
        if (this.lifetime <= 0) {
            this.sprite.destroy();
        }

        
    }

}

export default BubbleParticle;