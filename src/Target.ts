import { LevelRenderer } from "./renderer/LevelRenderer.js";
import { getRandomIntInclusive, Pos } from "./tools/tools.js";

export class Target {
    readonly target: HTMLElement;
    public readonly pos: Pos
    public readonly targetContainer: HTMLElement
    constructor(pos: Pos, targetContainer: HTMLElement) {
        this.pos = pos;
        this.targetContainer = targetContainer;

        this.target = document.createElement("div");
        this.target.classList.add("target");
        this.target.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;
    }

    draw(): void {
        this.targetContainer.appendChild(this.target);
    }

    clear(): void {
        this.targetContainer.removeChild(this.target);
    }
}
export class TargetPositioner {
    public readonly levelRenderer: LevelRenderer
    constructor(levelRenderer: LevelRenderer) {
        this.levelRenderer = levelRenderer;
    }
    _randomPos(): Pos {
        return {
            x: getRandomIntInclusive(0, this.levelRenderer.level.cols * this.levelRenderer.tileset.tileDimensions.width),
            y: getRandomIntInclusive(0, this.levelRenderer.level.rows * this.levelRenderer.tileset.tileDimensions.height),
        };
    }
    _collidesWithAnySolidTile(pos: Pos): boolean {
        for (const tile of this.levelRenderer.list) {
            if (tile.collides(pos)) {
                return true;
            };
        }
        return false;
    }
    findSpot(): Pos {
        let pos: Pos;
        let failCount = 100;
        do {
            pos = this._randomPos();
            console.log("try", pos);
            if (failCount-- < 0)
                throw new Error("did not find a position " + JSON.stringify(pos));

        } while (this._collidesWithAnySolidTile(pos));
        return pos;
    }
}
