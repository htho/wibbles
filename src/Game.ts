import { Level, LevelLoader } from "./Level.js";
import { Lives } from "./Lives.js";
import { RoundFactory } from "./Round.js";
import { JsonGame } from "./schema/game.js";
import { JsonMeta } from "./schema/level.js";
import { SpriteIndex, Spriteset, SpritesetLoader } from "./Spriteset.js";
import { Tileset, TilesetLoader } from "./Tileset.js";

export class Game {
    private readonly _levelLoader: LevelLoader;
    private readonly _tilesetLoader: TilesetLoader;
    private readonly _spritesetLoader: SpritesetLoader;
    private readonly _roundFactory: RoundFactory;
    private readonly _logger: {info: (msg: string) => void, alert: (msg: string) => void};
    private _lives: Lives;
    private readonly _level: { name: string, tileset: string }[];
    private readonly _meta: JsonMeta;
    private _currentLevelIndex = 0;
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
        console.log(`new Game`)
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

    async start(): Promise<void> {
        console.log(`Game.start()`)
        while (this.hasNextLevel) {
            await this._initializeLevel();
            console.log(`level initialzed`, this._currentLevel)
            while(true) {
                console.log(`createRound()`)
                const round = this._roundFactory.createRound(this._currentLevel, this._currentTileset);
                const roundResult = await round.start();
                console.log(`round over`, roundResult)
                if(!roundResult.liveLost) {
                    await round.dispose();
                    this._logger.info("Round Won!");
                    break;
                } else {
                    this._lives.decrease();
                    if(this._lives.left > 0) {
                        await round.dispose();
                        this._logger.alert(`Lives Left ${this._lives.left}`);
                    } else {
                        this._logger.alert("Game Over!");
                        await round.dispose();
                        return;
                    }
                }
            }
            
            this._currentLevelIndex++;
        }
        this._logger.alert("Game Won!");
    }
    get hasNextLevel(): boolean {
        return this._currentLevelIndex < this._level.length;
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
    private async _initializeLevel(): Promise<void> {
        const currentLevelData = this._level[this._currentLevelIndex];
        if (!currentLevelData) throw new Error("No level data available! Probably increased level too far.");
        

        const { level, tileset } = await this._loadLevel(currentLevelData);

        this._currentLevel = level;
        this._currentTileset = tileset;
    }

    static async Load(name: string): Promise<JsonGame> {
        const file = await fetch(`./data/game/${name}.json`);
        const game = await file.json() as JsonGame;
        return game;
    }
}
