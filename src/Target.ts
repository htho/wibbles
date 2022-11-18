import { RenderedLevel } from "./renderer/RenderedLevel.js";
import { Sprite } from "./Spriteset.js";
import { finalizeDisposal, IDisposable } from "./tools/IDisposable.js";
import { Dimensions, getRandomIntInclusive, Pos } from "./tools/tools.js";

export class Target implements IDisposable {
    readonly target: HTMLElement;
    public readonly pos: Pos;
    public readonly dimensions: Dimensions;
    public readonly targetContainer: HTMLElement;
    constructor(pos: Pos, targetContainer: HTMLElement, sprite: Sprite) {
        this.pos = pos;
        this.dimensions = sprite.dimensions;
        this.targetContainer = targetContainer;

        this.target = sprite.createElement();
        this.target.classList.add("target");
        this.target.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;
        this.target.style.width = `${this.dimensions.width}px`;
        this.target.style.height = `${this.dimensions.height}px`;
        
        this._draw();
    }
    dispose(): void {
        console.log(`dispose Target...`);

        this._isDisposed = true;

        this._clear();

        finalizeDisposal(this);
        console.log(`...Target disposed!`);
    }
    protected _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }

    private _draw(): void {
        this.targetContainer.appendChild(this.target);
    }

    private _clear(): void {
        this.targetContainer.removeChild(this.target);
    }
}
export class TargetPositioner {
    public readonly level: RenderedLevel;
    public readonly targetRadius: number;
    constructor(level: RenderedLevel, targetRadius: number) {
        console.log("new TargetPositioner", {level, targetRadius});
        this.level = level;
        this.targetRadius = targetRadius;
    }
    _randomPos(): Pos {
        return {
            x: getRandomIntInclusive(0, this.level.dimensions.width),
            y: getRandomIntInclusive(0, this.level.dimensions.height),
        };
    }
    _getBoxEdges(pos: Pos): {topLeft: Pos, topRight: Pos, bottomLeft: Pos, bottomRight: Pos} {
        return {
            topLeft: {x: pos.x - this.targetRadius, y: pos.y - this.targetRadius},
            topRight: {x: pos.x + this.targetRadius, y: pos.y - this.targetRadius},
            bottomLeft: {x: pos.x - this.targetRadius, y: pos.y + this.targetRadius},
            bottomRight: {x: pos.x + this.targetRadius, y: pos.y + this.targetRadius},
        };
    }
    _collidesWithAnySolidTile(pos: Pos): boolean {
        const edges = this._getBoxEdges(pos);
        for (const tile of this.level.list) {
            if (tile.collides(edges.topLeft)) return true;
            if (tile.collides(edges.topRight)) return true;
            if (tile.collides(edges.bottomLeft)) return true;
            if (tile.collides(edges.bottomRight)) return true;
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
