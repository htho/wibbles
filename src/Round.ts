import { Page } from "./browser/page.js";
import { WormRenderer } from "./MovingWorm.js";
import { LevelRenderer } from "./renderer/LevelRenderer.js";
import { Target, TargetPositioner } from "./Target.js";
import { finalizeDisposal, IDisposable } from "./tools/IDisposable.js";
import { WormHead } from "./Worm.js";

export class Round implements IDisposable {
    public readonly renderer: LevelRenderer;
    public readonly targetPositioner: TargetPositioner;
    public readonly worm: WormHead;
    public readonly movingWorm: WormRenderer;
    public readonly page: Page;
    private _currentTarget: Target;
    public get currentTarget(): Target {
        return this._currentTarget;
    }
    public set currentTarget(value: Target) {
        this._currentTarget = value;
    }
    public stopped: Promise<void>;
    constructor({ renderer, targetPositioner, worm, movingWorm, page }: { renderer: LevelRenderer; targetPositioner: TargetPositioner; worm: WormHead; movingWorm: WormRenderer; page: Page;}) {
        this.renderer = renderer;
        this.targetPositioner = targetPositioner;
        this.worm = worm;
        this.movingWorm = movingWorm;
        this.page = page;

        renderer.tileset.spriteIndex.spritesets.forEach(spriteset => page.addStyle(spriteset.meta.name, spriteset.cssStyle));

        page.addStyle("worm", movingWorm.css);

        const pos = targetPositioner.findSpot();
        this._currentTarget = new Target(pos, page.content);
        renderer.start.open();
        renderer.exit.close();
        this._currentTarget.draw();

        page.content.appendChild(renderer.html);
        window.addEventListener("keydown", this._keydownhandler);
        this.stopped = this.movingWorm.start();
    }

    private readonly _keydownhandler = (ev: KeyboardEvent) => {
        if (ev.key === "ArrowLeft")
            this.movingWorm.dir("W");
        if (ev.key === "ArrowRight")
            this.movingWorm.dir("E");
        if (ev.key === "ArrowUp")
            this.movingWorm.dir("N");
        if (ev.key === "ArrowDown")
            this.movingWorm.dir("S");
    };

    private _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }
    async dispose(): Promise<void> {
        this._isDisposed = true;

        this.movingWorm.stop();
        await this.stopped;
        window.removeEventListener("keydown", this._keydownhandler);
        this.page.content.removeChild(this.renderer.html);
        this._currentTarget.clear();
        this.page.removeStyle("worm");
        this.renderer.tileset.spriteIndex.spritesets.forEach(spriteset => this.page.removeStyle(spriteset.meta.name));

        finalizeDisposal(this);
    };
}
