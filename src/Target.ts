import { LevelRenderer } from "./LevelRenderer.js";
import { getRandomIntInclusive, Pos } from "./tools.js";
import { p, levelRenderer } from "./index";

class Target {
    readonly target = document.createElement("div");
    constructor(public readonly pos: Pos) {
        this.target.classList.add("target");
        this.target.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;
    }

    draw(): void {
        p.content.appendChild(this.target);
    }

    clear(): void {
        p.content.removeChild(this.target);
    }
}
export class Points {
    targetsLeft: number;
    constructor(public readonly levelRenderer: LevelRenderer) {
        this.targetsLeft = levelRenderer.level.targets;
    }
    randomPos(): Pos {
        return {
            x: getRandomIntInclusive(0, this.levelRenderer.level.width * this.levelRenderer.tileset.tileDimensions.width),
            y: getRandomIntInclusive(0, this.levelRenderer.level.height * this.levelRenderer.tileset.tileDimensions.height),
        };
    }
    _collidesWithTiles(pos: Pos): boolean {
        for (const tile of levelRenderer.list) {
            if (tile.collides(pos)) {
                return true;
            };
        }
        return false;
    }
    currentTarget?: Target;
    nextTarget(): void {
        if (this.currentTarget)
            this.currentTarget.clear();
        this.targetsLeft--;
        let pos: Pos;
        let failCount = 100;
        do {
            pos = this.randomPos();
            console.log("try", pos);
            if (failCount-- < 0)
                throw new Error("did not find a position " + JSON.stringify(pos));

        } while (this._collidesWithTiles(pos));
        console.log("NEXT", pos);
        this.currentTarget = new Target(pos);
        this.currentTarget.draw();
    }
}
