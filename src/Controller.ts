import type { Page } from "./browser/page.js";
import type { Game, Lives } from "./Game.js";
import type { Level } from "./Level.js";
import type { Tileset } from "./Tileset.js";
import type { IDisposed } from "./tools/IDisposable.js";
import type { Pos } from "./tools/tools.js";
import type { WormSegment } from "./Worm.js";

import { WormRenderer } from "./MovingWorm.js";
import { LevelRenderer } from "./renderer/LevelRenderer.js";
import { Round } from "./Round.js";
import { Target, TargetPositioner } from "./Target.js";
import { WormHead } from "./Worm.js";


export class Controller {
    private readonly page: Page;
    private readonly game: Game;
    private round: undefined | Round | IDisposed = undefined;

    constructor({ page, game }: { page: Page; game: Game; }) {
        this.page = page;
        this.game = game;

        this.initGameHandlers();
    }
    start(): void {

    }

    private handleLiveLost = async (lives: Lives) => {
        this.page.showAlert(`Live Lost! Lives left: ${lives.left}`);
    };
    private handleGameOver = async () => {
        this.page.showAlert("Game Over");
        await this.clean();
    };
    private handleGameWon = async () => {
        this.page.showAlert("Game Won");
        await this.clean();
    };
    private handleNewRound = async (level: Level, tileset: Tileset) => {
        this.page.showInfo("New Round");
        await this.clean();
        await this.newRound(level, tileset);
    };

    private initGameHandlers(): void {
        this.game.onLiveLost.set(this.handleLiveLost);
        this.game.onGameOver.set(this.handleGameOver);
        this.game.onGameWon.set(this.handleGameWon);
        this.game.onNewRound.set(this.handleNewRound);
    }

    async clean(): Promise<void> {
        if(!this.round) return; //throw new Error("Can not clean() no current round!");
        if(this.round.isDisposed) throw new Error("Can not clean() no round already disposed!");
        await this.round.dispose();
    }
    async newRound(level: Level, tileset: Tileset): Promise<void> {
        const renderer = new LevelRenderer(level, tileset);
        const targetPositioner = new TargetPositioner(renderer);
        const worm = new WormHead(renderer.startPos, level.startDirection, 30);
        const movingWorm = new WormRenderer(worm, renderer, this.page.content);
        
        worm.onAfterHeadMove.set(this.handleWormHeadMove);
        worm.onAfterMove.set(this.handleWormSegmentMove);
    
        this.round = new Round({
            renderer,
            targetPositioner,
            worm,
            movingWorm,
            page: this.page,
        });
    }

    private handleWormHeadMove = (worm: WormHead, pos: Pos): void => {
        if(!this.round) throw new Error("Can not clean() no current round!");
        if(this.round.isDisposed) throw new Error("Can not clean() no round already disposed!");
        
        for(const tile of this.round.renderer.list) {
            if(tile.collides(pos)) {
                this.page.showAlert("COLLIDES with SOLID TILE!")
                this.game.liveLost();
            };
        }
        for(const segment of worm.segments()) {
            if (worm.collides(segment.pos, 0)) {
                this.page.showAlert("COLLIDES with WORM!")
                this.game.liveLost();
            }
        }
        if(this.round.currentTarget && worm.collides(this.round.currentTarget.pos, 8)) {
            this.page.showInfo("COLLIDES with TARGET.")
            const pos = this.round.targetPositioner.findSpot();
            this.round.currentTarget = new Target(pos, this.page.content);
        }
    }

    private handleWormSegmentMove = (segment: WormSegment, pos: Pos): void => {
        if(!this.round) throw new Error("Can not clean() no current round!");
        if(this.round.isDisposed) throw new Error("Can not clean() no round already disposed!");
        
        this.round.movingWorm.updateSegment(segment, pos);
    }   
}
