import { Page, StyleContainer } from "./browser/page.js";
import { Level } from "./Level.js";
import { RenderedLevel } from "./renderer/RenderedLevel.js";
import { Target, TargetPositioner } from "./Target.js";
import { Tileset } from "./Tileset.js";
import { finalizeDisposal, IDisposable } from "./tools/IDisposable.js";
import { assertNonNullish, nextAnmiationFrame } from "./tools/tools.js";
import { WormHead } from "./Worm.js";

export class RoundFactory {
    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }
    createRound(level: Level, tileset: Tileset): Round {
        const styleContainer: StyleContainer = this.page;
        const renderedLevel = new RenderedLevel(level, tileset, this.page.content, styleContainer);
        const wormRadius = renderedLevel.tilesize/4;
        const targetPositioner = new TargetPositioner(renderedLevel, wormRadius);
        const worm = new WormHead(renderedLevel.startPos, level.startDirection, this.page.worm, wormRadius, 10, styleContainer);
    
        return new Round({
            level: renderedLevel,
            targetPositioner,
            worm,
            page: this.page,
        });
    }
}

export class Round implements IDisposable {
    public readonly level: RenderedLevel;
    public readonly targetPositioner: TargetPositioner;
    public readonly worm: WormHead;
    public readonly page: Page;
    public readonly tilesPerSecond = 1;
    public doubleSpeed = false;
    private _isPaused = false;
    private _currentTarget: Target | undefined;
    constructor({ level, targetPositioner, worm, page }: { level: RenderedLevel; targetPositioner: TargetPositioner; worm: WormHead; page: Page;}) {
        console.log(`new Round`);
        this.level = level;
        this.targetPositioner = targetPositioner;
        this.worm = worm;
        this.page = page;

        window.addEventListener("keydown", this._keydownhandler);
        window.addEventListener("keyup", this._keyuphandler);
    }
    dispose(): void {
        console.log(`dispose Round...`);
        
        this._isDisposed = true;
        
        window.removeEventListener("keydown", this._keydownhandler);
        window.removeEventListener("keyup", this._keyuphandler);

        if(this._currentTarget && !this._currentTarget.isDisposed) this._currentTarget.dispose();
        
        this.worm.dispose();
        this.level.dispose();

        finalizeDisposal(this);
        console.log(`...Round disposed!`);
    };
    
    async start(): Promise<{liveLost: true} | {liveLost: false}> {
        console.log(`Round.start()`)
        const pos = this.targetPositioner.findSpot();
        this._currentTarget = new Target(pos, this.worm.radius, this.page.content);
        let targetsLeft = this.level.level.targets;
        
        console.log("start.open()")
        this.level.start.open();
        console.log("exit.close()")
        this.level.exit.close();

        let lastFrameTime = performance.now();
        const tilesPerMillisecond = this.tilesPerSecond / 1000;
        const pxPerMillisecond = this.level.tilesize * tilesPerMillisecond;
        
        while (true) {
            const time = await nextAnmiationFrame();
            const timeSinceLastFrame = time - lastFrameTime;
            lastFrameTime = time;
            if(this._isPaused) continue;
            const speedFactor = this.doubleSpeed ? 4 : 1;
            const stepWidth = pxPerMillisecond * timeSinceLastFrame * speedFactor;
            let walkedWidth = 0
            while (walkedWidth < stepWidth) {
                this.worm.nextStep();
                walkedWidth = walkedWidth + this.worm.stepSize;
            }
            
            if(this._collidesWithWall()) {
                console.log("COLLIDE WITH WALL!");
                return {liveLost: true};
            } else if(this._collidesWithWorm()) {
                console.log("COLLIDE WITH WORM!");
                return {liveLost: true};
            } else if(this._collidesWitTarget()) {
                console.log("HIT TARGET!");
                targetsLeft--;
                assertNonNullish(this._currentTarget, `_currentTarget expected to be defined! Can only collide with tile if it actually exists!`);
                this._currentTarget.dispose();
                this._currentTarget = undefined;
                for (let i = 0; i < 3; i++) {
                    this.worm.grow();
                }
                if(targetsLeft <= 0) this.level.exit.open();
                else this._currentTarget = new Target(this.targetPositioner.findSpot(), this.worm.radius, this.page.content);
            } else if(this._tailCollidesWithExit()) {
                console.log("LEAVE THROUGH EXIT!");
                return {liveLost: false};
            }
            if(this.level.start.isOpen) this._closeStartOnceTheWormIsIn();
        }
        throw new Error("This loop never ends!");
    }

    private togglePause() {
        this._isPaused = !this._isPaused;
        if(this._isPaused) console.log("Paused!");
        else console.log("Unpaused!");
    }

    private _collidesWithWall(): boolean {
        for(const tile of this.level.list) {
            if(tile.collides(this.worm.pos)) {
                return true;
            };
        }
        return false;
    }
    private _collidesWithWorm(): boolean {
        const segements = this.worm.segments();
        const firstSegment = segements[0];
        if(!firstSegment) return false;
        if(firstSegment.pos.x === this.level.startPos.x && firstSegment.pos.y === this.level.startPos.y) return false;

        for(const segment of segements.slice(1)) {
            if (this.worm.collidesCircle(segment.pos, this.worm.radius)) {
                return true;
            }
        }
        return false;
    }
    private _collidesWitTarget(): boolean {
        if(this._currentTarget && this.worm.collidesCircle(this._currentTarget.pos, this._currentTarget.radius)) {
            return true;
        }
        return false;
    }
    private _tailCollidesWithExit(): boolean {
        const lastTail = this.worm.getLastTail();
        if(this.level.exit.collidesRegardlessOfState(lastTail.pos)) {
            return true;
        };
        return false;
    }
    private _closeStartOnceTheWormIsIn(): void {
        const lastTail = this.worm.getLastTail();
        const collides = this.level.start.collidesRegardlessOfState(lastTail.pos);
        if (collides) return;
        console.log("start.close()")
        this.level.start.close();
        return;
    }

    private readonly _keyuphandler = () => {
        this.doubleSpeed = false;
    }
    private readonly _keydownhandler = (ev: KeyboardEvent) => {
        if(ev.repeat) {
            this.doubleSpeed = true;
            return;
        }
        
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
