import { Page } from "./browser/page.js";
import { Game } from "./Game.js";
import { Level, LevelLoader } from "./Level.js";
import { WormRenderer } from "./MovingWorm.js";
import { LevelRenderer } from "./renderer/LevelRenderer.js";
import { SpritesetLoader } from "./Spriteset.js";
import { Target, TargetPositioner } from "./Target.js";
import { Tileset, TilesetLoader } from "./Tileset.js";
import { finalizeDisposal, IDisposable } from "./tools/IDisposable.js";
import { Pos } from "./tools/tools.js";
import { WormHead, WormSegment } from "./Worm.js";

const page = await Page.Load();

const game = new Game({
        initialLives: 5,
        level: [{name: "empty", tileset: "basic"}],
        meta: {
            author: "",
            name: "",
            version: 0
        }
    },
    {
        levelLoader: new LevelLoader(),
        tilesetLoader: new TilesetLoader(),
        spritesetLoader: new SpritesetLoader(),
    }
)

let round: Round | undefined;
let appData: {level: Level, tileset: Tileset} | undefined;

export class Round implements IDisposable {
    public readonly renderer: LevelRenderer;
    public readonly targetPositioner: TargetPositioner;
    public readonly worm: WormHead;
    public readonly movingWorm: WormRenderer;
    private _currentTarget: Target;
    public get currentTarget(): Target {
        return this._currentTarget;
    }
    public set currentTarget(value: Target) {
        this._currentTarget = value;
    }
    public stopped: Promise<void>;
    constructor({ renderer, targetPositioner, worm, movingWorm }: { renderer: LevelRenderer; targetPositioner: TargetPositioner; worm: WormHead; movingWorm: WormRenderer; }) {
        this.renderer = renderer;
        this.targetPositioner = targetPositioner;
        this.worm = worm;
        this.movingWorm = movingWorm;

        renderer.tileset.spriteIndex.spritesets.forEach(spriteset => page.addStyle(spriteset.meta.name, spriteset.cssStyle))

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
        if(ev.key === "ArrowLeft") this.movingWorm.dir("W");
        if(ev.key === "ArrowRight") this.movingWorm.dir("E");
        if(ev.key === "ArrowUp") this.movingWorm.dir("N");
        if(ev.key === "ArrowDown") this.movingWorm.dir("S");
    }

    private _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }
    async dispose(): Promise<void> {
        this._isDisposed = true;

        this.movingWorm.stop();
        await this.stopped;
        window.removeEventListener("keydown", this._keydownhandler);
        page.content.removeChild(this.renderer.html);
        this._currentTarget.clear();
        page.removeStyle("worm");
        this.renderer.tileset.spriteIndex.spritesets.forEach(spriteset => page.removeStyle(spriteset.meta.name))

        finalizeDisposal(this);
    };
}

async function clean() {
    if(!round) return;
    if(round.isDisposed) return;
    await round.dispose();
}
async function start(level: Level, tileset: Tileset) {
    const renderer = new LevelRenderer(level, tileset);
    const targetPositioner = new TargetPositioner(renderer);
    const worm = new WormHead(renderer.startPos, level.startDirection, onWormUpdate, 30);
    const movingWorm = new WormRenderer(worm, renderer, page.content);
    
    function onWormUpdate(segment: WormSegment, pos: Pos): void {
        movingWorm.updateSegment(segment, pos);
        if(segment instanceof WormHead) {
            for(const tile of renderer.list) {
                if(tile.collides(pos)) {
                    page.showAlert("COLLIDES with SOLID TILE!")
                    game.liveLost();
                };
            }
            for(const segment of worm.segments()) {
                if (worm.collides(segment.pos, 0)) {
                    page.showAlert("COLLIDES with WORM!")
                    game.liveLost();
                }
            }
            if(round?.currentTarget && worm.collides(round.currentTarget.pos, 8)) {
                page.showInfo("COLLIDES with TARGET.")
                const pos = round.targetPositioner.findSpot();
                round.currentTarget = new Target(pos, page.content);
            }
        }
    }   

    round = new Round({
        renderer,
        targetPositioner,
        worm,
        movingWorm,
    });


}

game.onLiveLost.set(async (lives) => {
    page.showAlert(`Live Lost! Lives left: ${lives.left}`);
    await clean();
    if(!appData) throw new Error("App Data not initialized yet!");
    await start(appData.level, appData.tileset)

})
game.onGameOver.set(async () => {
    page.showAlert("Game Over");
    await clean();
})
game.onGameWon.set(async () => {
    page.showAlert("Game Won");
    await clean();
})
game.onLevelLoaded.set(async (level, tileset) => {
    page.showInfo("New Round");
    await clean();
    appData = {
        level, tileset
    };
    await start(appData.level, appData.tileset)
});