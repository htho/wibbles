import { Level, LevelLoader } from "./Level.js";
import { JsonGame } from "./schema/game.js";
import { JsonMeta } from "./schema/level.js";
import { SpriteIndex, Spriteset, SpritesetLoader } from "./Spriteset.js";
import { Tileset, TilesetLoader } from "./Tileset.js";
import { EventEmitter, IEventEmitter } from "./tools/EventEmitter.js";

export class Lives {
    readonly amount: number;
    left: number;

    constructor(amount: number) {
        this.amount = amount;
        this.left = amount;
    }

    decrease(): void {
        this.left--;
    }
}

export type GameEvents = {"LevelLoaded": (level: Level, tileset: Tileset) => void, "GameOver": () => void, "GameWon": () => void};

export class Game implements IEventEmitter<GameEvents> {
    private readonly _emitter = new EventEmitter<GameEvents>();
    private readonly _levelLoader: LevelLoader;
    private readonly _tilesetLoader: TilesetLoader;
    private readonly _spritesetLoader: SpritesetLoader;
    private readonly _lives: Lives;
    private readonly _level: {name: string, tileset: string}[];
    private readonly _meta: JsonMeta;
    private _currentLevelIndex = 0;

    constructor(
        {initialLives, level, meta}: JsonGame,
        {levelLoader, tilesetLoader, spritesetLoader}: {
            levelLoader: LevelLoader,
            tilesetLoader: TilesetLoader,
            spritesetLoader: SpritesetLoader,
        }) {
        this._lives = new Lives(initialLives);
        this._level = level;
        this._meta = meta;

        console.log(this._meta);

        this._levelLoader = levelLoader;
        this._tilesetLoader = tilesetLoader;
        this._spritesetLoader = spritesetLoader;

        this._initializeLevel();
    }

    nextLevel(): void {
        this._currentLevelIndex++;
        this._initializeLevel();
    }
    async liveLost(): Promise<void> {
        this._lives.decrease();
        if(this._lives.left > 0) return;
     
        await this._emit("GameOver");
    }
    get livesLeft(): number {
        return this._lives.left;
    }

    private async _initializeLevel(): Promise<void> {
        const currentLevelData = this._level[this._currentLevelIndex];
        if(!currentLevelData) return void this._emit("GameWon");
        
        const jsonLevel = await this._levelLoader.load(currentLevelData.name);
        const jsonTileset = await this._tilesetLoader.load(currentLevelData.tileset);

        const level = new Level(jsonLevel);
        const jsonSpritesetsInTileset = await this._spritesetLoader.load(jsonTileset.spritesets);
        const spritesetsInTileset = jsonSpritesetsInTileset.map(jsonSpriteset => new Spriteset(jsonSpriteset));
        const spriteIndex = new SpriteIndex(spritesetsInTileset);
        const tileset = new Tileset(jsonTileset, spriteIndex);

        await this._emit("LevelLoaded", level, tileset);
    }

    private async _emit<K extends keyof GameEvents>(event: K, ...args: Parameters<GameEvents[K]>): Promise<void> {
        this._emitter.emit(event, ...args);
    }
    on<K extends keyof GameEvents>(event: K, cb: GameEvents[K]): void {
        return this._emitter.on(event, cb);
    }
    off<K extends keyof GameEvents>(event: K, cb: GameEvents[K]): void {
        return this._emitter.off(event, cb);
    }
    
    static async Load(name: string): Promise<JsonGame> {
        const file = await fetch(`./data/game/${name}.json`);
        const game = await file.json() as JsonGame;
        return game;
    }
}
