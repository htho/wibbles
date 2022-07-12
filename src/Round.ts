import { Page } from "./browser/page.js";
import { Level } from "./Level.js";
import { LevelRenderer } from "./renderer/LevelRenderer.js";
import { Target, TargetPositioner } from "./Target.js";
import { Tileset } from "./Tileset.js";
import { finalizeDisposal, IDisposable } from "./tools/IDisposable.js";
import { nextAnmiationFrame } from "./tools/tools.js";
import { WormHead } from "./Worm.js";

export class RoundFactory {
    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }
    createRound(level: Level, tileset: Tileset): Round {
        const renderer = new LevelRenderer(level, tileset);
        const targetPositioner = new TargetPositioner(renderer);
        const worm = new WormHead(renderer.startPos, level.startDirection, this.page.worm, renderer.standardTileSize/4, 10);
    
        return new Round({
            renderer,
            targetPositioner,
            worm,
            page: this.page,
        });
    }
}

export class Round implements IDisposable {
    public readonly renderer: LevelRenderer;
    public readonly targetPositioner: TargetPositioner;
    public readonly worm: WormHead;
    public readonly page: Page;
    public readonly tilesPerSecond = 2;
    private _isPaused = false;
    private _currentTarget!: Target;
    public get currentTarget(): Target {
        return this._currentTarget;
    }
    public set currentTarget(value: Target) {
        this._currentTarget = value;
    }
    constructor({ renderer, targetPositioner, worm, page }: { renderer: LevelRenderer; targetPositioner: TargetPositioner; worm: WormHead; page: Page;}) {
        console.log(`new Round`)
        this.renderer = renderer;
        this.targetPositioner = targetPositioner;
        this.worm = worm;
        this.page = page;

        this.renderer.tileset.spriteIndex.spritesets.forEach(spriteset => page.addStyle(spriteset.meta.name, spriteset.cssStyle));

        this.page.addStyle("standard-tile-size", this.createStandardTileSizeCssProperty());
        this.page.worm.insertAdjacentElement("afterbegin", this.worm.element);

        this.page.content.appendChild(renderer.html);
        window.addEventListener("keydown", this._keydownhandler);
    }
    async dispose(): Promise<void> {
        console.log(`Round.dispose()`)
        
        this._isDisposed = true;
        
        window.removeEventListener("keydown", this._keydownhandler);
        this.page.content.removeChild(this.renderer.html);
        this._currentTarget.clear();
        this.page.worm.removeChild(this.worm.element);
        this.page.removeStyle("standard-tile-size");
        this.renderer.tileset.spriteIndex.spritesets.forEach(spriteset => this.page.removeStyle(spriteset.meta.name));
        this.worm.dispose();

        finalizeDisposal(this);
        console.log(`Round.dispose() ... disposed!`)
    };

    private createStandardTileSizeCssProperty(): string {
        return `
            :root {
                --standard-tile-size: ${this.renderer.standardTileSize}px;
            }
        `;
    }
    
    async start(): Promise<{liveLost: true} | {liveLost: false}> {
        console.log(`Round.start()`)
        const pos = this.targetPositioner.findSpot();
        this._currentTarget = new Target(pos, this.page.content);
        this._currentTarget.draw();
        let targetsLeft = this.renderer.level.targets;
        
        this.renderer.start.open();
        this.renderer.exit.close();

        let lastStepTime = 0;
        const pxPerSecond = this.renderer.standardTileSize * this.tilesPerSecond;
        const interval = 1000 / pxPerSecond;
        
        while (true) {
            const time = await nextAnmiationFrame();
            if(this._isPaused) continue;
            const timeSinceLastStep = time - lastStepTime;
            if (timeSinceLastStep < interval) continue;
            
            lastStepTime = time;
            await this.worm.nextStep();
            
            if(this._collidesWithWall()) {
                console.log("COLLIDE WITH WALL!");
                return {liveLost: true};
            } else if(this._collidesWithWorm()) {
                console.log("COLLIDE WITH WORM!");
                return {liveLost: true};
            } else if(this._collidesWitTarget()) {
                console.log("HIT TARGET!");
                targetsLeft--;
                if(targetsLeft <= 0) this.renderer.exit.open();
            } else if(this._tailCollidesWithExit()) {
                console.log("LEAVE THROUGH EXIT!");
                return {liveLost: false};
            }
            if(this.renderer.start.isOpen) this._closeStartOnceTheWormIsIn();
        }
        throw new Error("This loop never ends!");
    }

    private togglePause() {
        this._isPaused = !this._isPaused;
        if(this._isPaused) console.log("Paused!");
        else console.log("Unpaused!");
    }

    private _collidesWithWall(): boolean {
        for(const tile of this.renderer.list) {
            if(tile.collides(this.worm.pos)) {
                return true;
            };
        }
        return false;
    }
    private _collidesWithWorm(): boolean {
        for(const segment of this.worm.segments()) {
            if (this.worm.collides(segment.pos, 0)) {
                return true;
            }
        }
        return false;
    }
    private _collidesWitTarget(): boolean {
        if(this.currentTarget && this.worm.collides(this.currentTarget.pos, 8)) {
            return true;
        }
        return false;
    }
    private _tailCollidesWithExit(): boolean {
        const lastTail = this.worm.getLastTail();
        if(this.renderer.exit.collidesRegardlessOfState(lastTail.pos)) {
            return true;
        };
        return false;
    }
    private _closeStartOnceTheWormIsIn(): void {
        const lastTail = this.worm.getLastTail();
        const collides = this.renderer.start.collidesRegardlessOfState(lastTail.pos);
        if (collides) return;
        this.renderer.start.close();
        return;
    }

    private readonly _keydownhandler = (ev: KeyboardEvent) => {
        if (ev.key === "ArrowLeft") this.worm.changeDir("W");
        if (ev.key === "ArrowRight") this.worm.changeDir("E");
        if (ev.key === "ArrowUp") this.worm.changeDir("N");
        if (ev.key === "ArrowDown") this.worm.changeDir("S");
        if (ev.key === "p") this.togglePause();
    };

    private _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }
    
}
