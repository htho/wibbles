import { Page, StyleContainer } from "./browser/page.js";
import { Level } from "./Level.js";
import { RenderedLevel } from "./renderer/RenderedLevel.js";
import { Target, TargetPositioner } from "./Target.js";
import { Tileset } from "./Tileset.js";
import { finalizeDisposal, IDisposable } from "./tools/IDisposable.js";
import { assertNonNullish, Direction, nextAnmiationFrame, nextTimeout, notNullCoersed, Pos } from "./tools/tools.js";
import { WormHead } from "./Worm.js";
export class RoundFactory {
    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }
    createRound(level: Level, tileset: Tileset, lives: {left: number, amount: number}): Round {
        const styleContainer: StyleContainer = this.page;
        const renderedLevel = new RenderedLevel(level, tileset, this.page.root, this.page.content, styleContainer);
        const wormRadius = renderedLevel.tilesize/4;
        const targetPositioner = new TargetPositioner(renderedLevel, wormRadius);
        const worm = new WormHead(renderedLevel.startPos, level.startDirection, this.page.worm, wormRadius, 10, styleContainer);
    
        return new Round({
            level: renderedLevel,
            targetPositioner,
            worm,
            page: this.page,
            lives,
        });
    }
}

export enum RoundResult {
    WON,
    LOST,
}

class UserInput {
    public onTogglePause!: () => void;
    public onChangeDir!: (dir: Direction) => void;
    public onStartHighspeed!: () => void;
    public onStopHighspeed!: () => void;

    private readonly _keyboardInput: KeyboardInput;
    private readonly _pointerInput: PointerInput;

    constructor() {
        this._keyboardInput = new KeyboardInput(this);
        this._pointerInput = new PointerInput(this);
    }

    dispose(): void {
        this._isDisposed = true;

        this._keyboardInput.dispose();
        this._pointerInput.dispose();
    }
    private _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }
}
class KeyboardInput implements IDisposable {
    private readonly target: UserInput;
    constructor(target: UserInput) {
        this.target = target;
        window.addEventListener("keydown", this._keydownhandler);
        window.addEventListener("keyup", this._keyuphandler);
    }

    dispose(): void {
        this._isDisposed = true;
        
        window.removeEventListener("keydown", this._keydownhandler);
        window.removeEventListener("keyup", this._keyuphandler);
    }
    private _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }
    private readonly _keyuphandler = () => {
        this.target.onStopHighspeed();
    };
    private readonly _keydownhandler = (ev: KeyboardEvent) => {
        if(ev.repeat) {
            this.target.onStartHighspeed();
            return;
        }
        
        if (ev.key === "ArrowLeft") this.target.onChangeDir(Direction.W);
        else if (ev.key === "ArrowRight") this.target.onChangeDir(Direction.E);
        else if (ev.key === "ArrowUp") this.target.onChangeDir(Direction.N);
        else if (ev.key === "ArrowDown") this.target.onChangeDir(Direction.S);
        else if (ev.key === "p") this.target.onTogglePause();
    };
}
class PointerInput implements IDisposable {
    private readonly target: UserInput;
    constructor(target: UserInput) {
        this.target = target;

        document.addEventListener("pointerdown", this._pointerdownhandler, false);
        document.addEventListener("pointerup", this._pointeruphandler, false);
        document.addEventListener("pointercancel", this._pointercancelhandler, false);
        document.addEventListener("pointermove", this._pointermovehandler, false);
    }

    dispose(): void {
        this._isDisposed = true;

        document.removeEventListener("pointerdown", this._pointerdownhandler);
        document.removeEventListener("pointerup", this._pointeruphandler);
        document.removeEventListener("pointercancel", this._pointercancelhandler);
        document.removeEventListener("pointermove", this._pointermovehandler);
    }
    private _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }
    /** the amount of move events until an interaction is recognized */
    private readonly _moveThreshold = 3;
    /** the amount of move events until we swich to highspeed mode */
    private readonly _highspeedThreshold = 5;
    private _moveCounter = 0;
    /** the position where the pointer down event occured */
    private _startPos?: Pos | undefined;
    private get _isPointerDown() {return this._startPos !== undefined;}
    private readonly _pointerdownhandler = (ev: PointerEvent) => {
        if(!ev.isPrimary) return;

        if(this._isPointerDown) return console.error("down again!", ev);
      
        this._startPos = {x: ev.x, y: ev.y};
        this._moveCounter = 0;
    };
    private readonly _pointeruphandler = (ev: PointerEvent) => {
        if(!ev.isPrimary) return;

        this.target.onStopHighspeed();
        if(!this._isPointerDown) return console.error("up again!", ev);

        if(this._moveCounter <= this._moveThreshold) this.target.onTogglePause();
        this._startPos = undefined;
    };
    private readonly _pointercancelhandler = (ev: PointerEvent) => {
        if(!ev.isPrimary) return;

        this.target.onStopHighspeed();
        if(!this._isPointerDown) return console.error("CANCEL but not down?!", ev);
        
        this._startPos = undefined;
    };
    private readonly _pointermovehandler = (ev: PointerEvent) => {
        if(!ev.isPrimary) return;
        if(!this._isPointerDown) return;
        
        this._moveCounter++;
        if(this._moveCounter < this._moveThreshold) return;
        
        const direction = this._getDirectionFromStart(ev);
        if(!direction) return;
        
        this.target.onChangeDir(direction);
        
        if(this._moveCounter < this._highspeedThreshold) return;
        this.target.onStartHighspeed();
    };
    private _getDirectionFromStart(ev: PointerEvent) {
        const delta = this._getDeltaFromStart(ev);
        return this._getDirectionFromDelta(delta);
    }
    private _getDeltaFromStart(ev: PointerEvent) {
        const {x: sx, y: sy} = this._startPos ?? notNullCoersed("_startPos can not be nullish at this point!");
        const {x: ex, y: ey} = ev;
        const dx = ex - sx;
        const dy = ey - sy;
        return {dx, dy};
    }
    private _getDirectionFromDelta({dx, dy}: {dx: number, dy: number}) {
        const isHorizontal = Math.abs(dx) > Math.abs(dy);
        if(isHorizontal && dx < 0) return Direction.W;
        if(isHorizontal && dx > 0) return Direction.E;
        if(!isHorizontal && dy < 0) return Direction.N;
        if(!isHorizontal && dy > 0) return Direction.S;
        return undefined;
    }
}

export class Round implements IDisposable {
    public readonly level: RenderedLevel;
    public readonly targetPositioner: TargetPositioner;
    public readonly worm: WormHead;
    public readonly page: Page;
    private readonly _input: UserInput;
    private _pxPerMillisecond: number;
    public highSpeed = false;
    private _isPaused = false;
    private _currentTarget: Target | undefined;
    constructor({ level, targetPositioner, worm, page, tilesPerSecond=1, lives }: { level: RenderedLevel; targetPositioner: TargetPositioner; worm: WormHead; page: Page; tilesPerSecond?: number, lives: {left: number, amount: number}}) {
        console.log(`new Round`);
        this.level = level;
        this.targetPositioner = targetPositioner;
        this.worm = worm;
        this.page = page;

        this.page.setLives(lives.left, lives.amount);
        this.page.setProgress(0, this.level.level.targets);
        this.page.setMapname(this.level.level.meta.name);

        this._input = new UserInput();
        this._input.onChangeDir = (dir: Direction) => this.worm.changeDir(dir);
        this._input.onTogglePause = () => this.togglePause();
        this._input.onStartHighspeed = () => this.highSpeed = true;
        this._input.onStopHighspeed = () => this.highSpeed = false;

        const tilesPerMillisecond = tilesPerSecond / 1000;
        this._pxPerMillisecond = this.level.tilesize * tilesPerMillisecond;

    }
    dispose(): void {
        console.log(`dispose Round...`);
        
        this._isDisposed = true;
        
        if(this._currentTarget && !this._currentTarget.isDisposed) this._currentTarget.dispose();
        
        this._input.dispose();
        this.worm.dispose();
        this.level.dispose();

        finalizeDisposal(this);
        console.log(`...Round disposed!`);
    }
    
    private _isRunning = false;
    async start(): Promise<RoundResult> {
        console.log(`Round.start()`);
        this._showNextTarget();
        
        console.log("start.open()");
        this.level.start.open();
        console.log("exit.close()");
        this.level.exit.close();
        this._isRunning = true;
        const isRendering = this.renderLoop();
        const result = await this.gameLoop();
        this._isRunning = false;
        await isRendering;
        return result;
    }

    async renderLoop(): Promise<void> {
        while (this._isRunning) {
            await nextAnmiationFrame();
            this.worm.renderNext();
        }
    }

    async gameLoop(): Promise<RoundResult> {
        let targetsLeft = this.level.level.targets;

        let lastFrameTime = performance.now();
        
        while (!this._hasLeftThroughExit()) {
            await nextTimeout();
            const time = performance.now();
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
                this.page.setProgress(
                    this.level.level.targets - targetsLeft,
                    this.level.level.targets
                );
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

    private togglePause = () => {
        this._isPaused = !this._isPaused;
        if(this._isPaused) console.log("Paused!");
        else console.log("Unpaused!");
    };

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


    private _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }
    
}
