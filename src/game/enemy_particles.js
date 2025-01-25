import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";

class EnemyParticle {
    constructor(viewport, startx, starty) {

        this.sprite = new PIXI.Graphics();
        this.viewport = viewport;

        // this.startx = startx + Math.random() * 10 - 5;
        // this.starty = starty + Math.random() * 10 - 5;
        this.startx = startx;
        this.starty = starty;

        // big bubble color:#a74274
        //#a3ddff
        this.sprite.fill(0xa74274);
        this.sprite.fill(0xa74274);
        this.sprite.poly([
            this.startx, this.starty - 3,
            this.startx - 3, this.starty + 3,
            this.startx + 3, this.starty + 3
        ]);
        this.sprite.fill();
        // randomly rotate the sprite around its center
        this.sprite.pivot.set(this.startx, this.starty);
        this.sprite.rotation = Math.random() * Math.PI * 2;
        this.sprite.x = this.startx;
        this.sprite.y = this.starty
        this.viewport.addChild(this.sprite);
        // choose a random direction for the particle to move in
        this.dx = Math.random() * 2 - 1;
        this.dy = Math.random() * 2 - 1;

        this.maxLifetime = 300;
        this.lifetime = this.maxLifetime;

        this.speed = 0.3
    

    }


    update(delta) {

        this.sprite.alpha = this.lifetime/this.maxLifetime;
        this.sprite.x += this.dx * delta.deltaTime * this.speed * (this.lifetime / this.maxLifetime) * (Math.random() * 3);
        this.sprite.y += this.dy * delta.deltaTime * this.speed * (this.lifetime / this.maxLifetime) * (Math.random() * 3);

        this.lifetime -= delta.deltaTime;
        // if the particle has faded out, destroy it
        if (this.lifetime <= 0) {
            this.sprite.destroy();
        }

        
    }

}

export default EnemyParticle;