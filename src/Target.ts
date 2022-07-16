import { createElement } from "./browser/dom.js";
import { RenderedLevel } from "./renderer/RenderedLevel.js";
import { finalizeDisposal, IDisposable } from "./tools/IDisposable.js";
import { getRandomIntInclusive, Pos } from "./tools/tools.js";

export class Target implements IDisposable {
    readonly target: HTMLElement;
    public readonly pos: Pos
    public readonly targetContainer: HTMLElement
    constructor(pos: Pos, targetContainer: HTMLElement) {
        this.pos = pos;
        this.targetContainer = targetContainer;

        this.target = createElement("div", {
            classList: ["target"],
            style: {
                transform: `translate(${this.pos.x}px, ${this.pos.y}px)`,
            }
        });
        this._draw();
    }
    dispose(): void {
        console.log(`dispose Target...`)

        this._isDisposed = true;

        this._clear();

        finalizeDisposal(this);
        console.log(`...Target disposed!`);
    };
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
    public readonly level: RenderedLevel
    constructor(level: RenderedLevel) {
        console.log("new TargetPositioner", {level});
        this.level = level;
    }
    _randomPos(): Pos {
        return {
            x: getRandomIntInclusive(0, this.level.dimensions.width),
            y: getRandomIntInclusive(0, this.level.dimensions.height),
        };
    }
    _collidesWithAnySolidTile(pos: Pos): boolean {
        for (const tile of this.level.list) {
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
