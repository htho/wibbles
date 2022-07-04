import { Page } from "./browser/page.js";
import { Game } from "./Game.js";
import { LevelLoader } from "./Level.js";
import { WormRenderer } from "./MovingWorm.js";
import { LevelRenderer } from "./renderer/LevelRenderer.js";
import { SpriteIndex } from "./Spriteset.js";
import { Target, TargetPositioner } from "./Target.js";
import { TilesetLoader } from "./Tileset.js";
import { Pos } from "./tools/tools.js";
import { WormHead, WormSegment } from "./Worm.js";

const page = await Page.Load();

const spriteIndex = new SpriteIndex(await SpriteIndex.Load({
    "oga--zelda-like-tilesets-and-sprites": [
        "overworld",
        "objects"
    ],
}));
spriteIndex.spritesets.forEach(spriteset => page.addStyle(spriteset.meta.name, spriteset.cssStyle))

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
        spriteIndex,
    }
)

let round: Round | undefined = undefined;

export class Round {
    public readonly renderer: LevelRenderer;
    public readonly targetPositioner: TargetPositioner;
    public readonly worm: WormHead;
    public readonly movingWorm: WormRenderer;
    private _currentTarget!: Target;
    public get currentTarget(): Target {
        return this._currentTarget;
    }
    public set currentTarget(value: Target) {
        this._currentTarget = value;
    }
    constructor({ renderer, targetPositioner, worm, movingWorm }: { renderer: LevelRenderer; targetPositioner: TargetPositioner; worm: WormHead; movingWorm: WormRenderer; }) {
        this.renderer = renderer;
        this.targetPositioner = targetPositioner;
        this.worm = worm;
        this.movingWorm = movingWorm;
    }
}


game.on("GameOver", () => {
    page.showAlert("Game Over");
    if(round) page.content.removeChild(round.renderer.html);
})
game.on("GameWon", () => {
    page.showAlert("Game Over");
    if(round) page.content.removeChild(round.renderer.html);
})
game.on("LevelLoaded", (level, tileset) => {
    if(round) page.content.removeChild(round.renderer.html);


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
    page.addStyle("worm", movingWorm.css);
    window.addEventListener("keydown", (ev) => {
        if(ev.key === "ArrowLeft") movingWorm.dir("W");
        if(ev.key === "ArrowRight") movingWorm.dir("E");
        if(ev.key === "ArrowUp") movingWorm.dir("N");
        if(ev.key === "ArrowDown") movingWorm.dir("S");
    });
    round = new Round({
        renderer,
        targetPositioner,
        worm,
        movingWorm,
    });
    const pos = round.targetPositioner.findSpot();
    round.currentTarget = new Target(pos, page.content);
    round.renderer.start.open();
    round.renderer.exit.close();
    
    page.content.appendChild(round.renderer.html);
    movingWorm.start();
});