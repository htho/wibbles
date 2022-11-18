import { Page, StyleContainer } from "./browser/page.js";
import { Level } from "./Level.js";
import { RenderedLevel } from "./renderer/RenderedLevel.js";
import { Target, TargetPositioner } from "./Target.js";
import { Tileset } from "./Tileset.js";
import { finalizeDisposal, IDisposable } from "./tools/IDisposable.js";
import { assertNonNullish, Direction, nextAnmiationFrame } from "./tools/tools.js";
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

export enum RoundResult {
    WON,
    LOST,
}

export class Round implements IDisposable {
    public readonly level: RenderedLevel;
    public readonly targetPositioner: TargetPositioner;
    public readonly worm: WormHead;
    public readonly page: Page;
    private _pxPerMillisecond: number;
    public highSpeed = false;
    private _isPaused = false;
    private _currentTarget: Target | undefined;
    constructor({ level, targetPositioner, worm, page, tilesPerSecond=1 }: { level: RenderedLevel; targetPositioner: TargetPositioner; worm: WormHead; page: Page; tilesPerSecond?: number}) {
        console.log(`new Round`);
        this.level = level;
        this.targetPositioner = targetPositioner;
        this.worm = worm;
        this.page = page;

        const tilesPerMillisecond = tilesPerSecond / 1000;
        this._pxPerMillisecond = this.level.tilesize * tilesPerMillisecond;

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
    }
    
    async start(): Promise<RoundResult> {
        console.log(`Round.start()`);
        this._showNextTarget();
        let targetsLeft = this.level.level.targets;
        
        console.log("start.open()");
        this.level.start.open();
        console.log("exit.close()");
        this.level.exit.close();

        let lastFrameTime = performance.now();
        
        while (!this._hasLeftThroughExit()) {
            const time = await nextAnmiationFrame();
            const timeSinceLastFrame = time - lastFrameTime;
            lastFrameTime = time;

            if(this._isPaused) continue;
            
            const speedFactor = this.highSpeed ? 4 : 1;
            const stepWidth = this._pxPerMillisecond * timeSinceLastFrame * speedFactor;

            this._nextStep(stepWidth);
            
            if(this._collidesWithWall()) {
                console.log("COLLIDE WITH WALL!");
                return RoundResult.LOST;
            } else if(this._collidesWithWorm()) {
                console.log("COLLIDE WITH WORM!");
                return RoundResult.LOST;
            } else if(this._collidesWithTarget()) {
                console.log("HIT TARGET!");
                targetsLeft--;
                this._cleanTarget();
                this._growWorm();
                this._increseSpeed();
                if(targetsLeft <= 0) this.level.exit.open();
                else this._showNextTarget();
            }
            if(this.level.start.isOpen) this._closeStartOnceTheWormIsIn();
        }
        console.log("LEAVE THROUGH EXIT!");
        return RoundResult.WON;
    }

    private _nextStep(width: number): void {
        let walkedWidth = 0;
        while (walkedWidth < width) {
            this.worm.nextStep();
            walkedWidth = walkedWidth + this.worm.stepSize;
        }
    }

    private _cleanTarget(): void {
        assertNonNullish(this._currentTarget, `_currentTarget expected to be defined! Can only collide with tile if it actually exists!`);
        this._currentTarget.dispose();
        this._currentTarget = undefined;
    }
    private _showNextTarget(): void {
        const pos = this.targetPositioner.findSpot();
        this._currentTarget = new Target(
            pos,
            this.page.content,
            this.level.tileset.target
        );
    }
    private _growWorm(): void {
        for (let i = 0; i < 3; i++) {
            this.worm.grow();
        }
    }
    private _increseSpeed(): void {
        this._pxPerMillisecond *= 1.1;
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
            }
        }
        return false;
    }
    private _collidesWithWorm(): boolean {
        const segements = this.worm.segments();
        const firstSegment = segements[0];
        if(!firstSegment) return false;
        if(
            firstSegment.pos.x === this.level.startPos.x &&
            firstSegment.pos.y === this.level.startPos.y
        ) return false;

        for(const segment of segements.slice(1)) {
            if (this.worm.collidesCircle(segment.pos, this.worm.radius)) {
                return true;
            }
        }
        return false;
    }
    private _collidesWithTarget(): boolean {
        if(!this._currentTarget) return false;
        return this.worm.collidesSizedBox(
            this._currentTarget.pos,
            this._currentTarget.dimensions
        );
    }
    private _hasLeftThroughExit(): boolean {
        const lastTail = this.worm.getLastTail();
        if(this.level.exit.collidesRegardlessOfState(lastTail.pos)) {
            return true;
        }
        return false;
    }
    private _closeStartOnceTheWormIsIn(): void {
        const lastTail = this.worm.getLastTail();
        const collides = this.level.start.collidesRegardlessOfState(lastTail.pos);
        if (collides) return;
        console.log("start.close()");
        this.level.start.close();
        return;
    }

    private readonly _keyuphandler = () => {
        this.highSpeed = false;
    };
    private readonly _keydownhandler = (ev: KeyboardEvent) => {
        if(ev.repeat) {
            this.highSpeed = true;
            return;
        }
        
        if (ev.key === "ArrowLeft") this.worm.changeDir(Direction.W);
        else if (ev.key === "ArrowRight") this.worm.changeDir(Direction.E);
        else if (ev.key === "ArrowUp") this.worm.changeDir(Direction.N);
        else if (ev.key === "ArrowDown") this.worm.changeDir(Direction.S);
        else if (ev.key === "p") this.togglePause();
    };

    private _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }
    
}
