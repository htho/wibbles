import { Level, LevelLoader } from "./Level.js";
import { Lives } from "./Lives.js";
import { RoundFactory, RoundResult } from "./Round.js";
import { JsonGame, JsonLevel } from "./schema/game.js";
import { JsonMeta } from "./schema/level.js";
import { SpriteIndex, Spriteset, SpritesetLoader } from "./Spriteset.js";
import { Tileset, TilesetLoader } from "./Tileset.js";

export enum LevelResult {
    WON,
    LOST,
}
export enum GameResult {
    WON,
    LOST,
}

export class Game {
    private readonly _levelLoader: LevelLoader;
    private readonly _tilesetLoader: TilesetLoader;
    private readonly _spritesetLoader: SpritesetLoader;
    private readonly _roundFactory: RoundFactory;
    private readonly _logger: {info: (msg: string) => void, alert: (msg: string) => void};
    private _lives: Lives;
    private readonly _level: JsonLevel[];
    private readonly _meta: JsonMeta;
    private _currentLevel!: Level;
    private _currentTileset!: Tileset;

    constructor(
        { initialLives, level, meta }: JsonGame,
        { levelLoader, tilesetLoader, spritesetLoader, roundFactory, logger }: {
            levelLoader: LevelLoader,
            tilesetLoader: TilesetLoader,
            spritesetLoader: SpritesetLoader,
            roundFactory: RoundFactory,
            logger: {info: (msg: string) => void, alert: (msg: string) => void}
        }) {
        console.log(`new Game`);
        this._lives = new Lives(initialLives);
        this._level = level;
        this._meta = meta;

        this._levelLoader = levelLoader;
        this._tilesetLoader = tilesetLoader;
        this._spritesetLoader = spritesetLoader;
        this._roundFactory = roundFactory;
        this._logger = logger;
       
        this._logger.info(JSON.stringify(this._meta));
    }

    async start(): Promise<GameResult> {
        console.log(`Game.start()`);
        for(const jsonLevel of this._level) {
            await this._initializeLevel(jsonLevel);
            console.log(`level initialzed`, this._currentLevel);
            const levelResult = await this._completeLevel();
            if(levelResult === LevelResult.LOST) {
                this._logger.alert("Game Over!");
                return GameResult.LOST;
            }
        }
        this._logger.alert("Game Won!");
        return GameResult.WON;
    }
    
    private async _completeLevel(): Promise<LevelResult> {
        while (this._lives.left >= 0) {
            const roundWon = await this._runRound();
            if(roundWon === RoundResult.WON) {
                this._logger.info("Round Won!");
                return LevelResult.WON;
            }
            this._lives.decrease();
            this._logger.alert(`Lives Left ${this._lives.left}`);
        }
        return LevelResult.LOST;
    }

    private async _runRound(): Promise<RoundResult> {
        console.log(`createRound()`);
        const round = this._roundFactory.createRound(this._currentLevel, this._currentTileset, this._lives);
        const roundResult = await round.start();
        console.log(`round over`, RoundResult[roundResult]);
        round.dispose();
        return roundResult;
    }

    private async _loadLevel({ name, tileset }: { name: string, tileset: string }): Promise<{ level: Level, tileset: Tileset }> {
        const jsonLevel = await this._levelLoader.load(name);
        const jsonTileset = await this._tilesetLoader.load(tileset);

        const level = new Level(jsonLevel);
        const jsonSpritesetsInTileset = await this._spritesetLoader.load(jsonTileset.spritesets);
        const spritesetsInTileset = jsonSpritesetsInTileset.map(jsonSpriteset => new Spriteset(jsonSpriteset));
        const spriteIndex = new SpriteIndex(spritesetsInTileset);
        const tilesetObj = new Tileset(jsonTileset, spriteIndex);

        return { level, tileset: tilesetObj };
    }
    private async _initializeLevel(jsonLevel: { name: string, tileset: string }): Promise<void> {
        const { level, tileset } = await this._loadLevel(jsonLevel);

        this._currentLevel = level;
        this._currentTileset = tileset;
    }

    static async Load(name: string): Promise<JsonGame> {
        const file = await fetch(`./data/games/${name}.json`);
        const game = await file.json() as JsonGame;
        return game;
    }
}
