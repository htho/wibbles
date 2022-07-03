import { Level, LevelLoader } from "./Level.js";
import { JsonGame } from "./schema/game.js";
import { JsonMeta } from "./schema/level.js";
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

export type GameEvents = {"LevelLoaded": (level: Level) => void, "GameOver": () => void, "GameWon": () => void};

export class Game implements IEventEmitter<GameEvents> {
    private readonly _emitter = new EventEmitter<GameEvents>();
    private readonly _levelLoader: LevelLoader;
    private readonly _lives: Lives;
    private readonly _levelNames: string[];
    private readonly _meta: JsonMeta;
    private _currentLevel?: Level;
    private _currentLevelIndex = 0;

    constructor({initialLives, levelNames, meta}: JsonGame, {levelLoader}: {levelLoader: LevelLoader}) {
        this._lives = new Lives(initialLives);
        this._levelNames = levelNames;
        this._meta = meta;

        console.log(this._meta);

        this._levelLoader = levelLoader;

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
        const currentLevelName = this._levelNames[this._currentLevelIndex];
        if(!currentLevelName) return void this._emit("GameWon")
        
        const level = await this._levelLoader.load(currentLevelName);
        this._currentLevel = new Level(level);
        this._emit("LevelLoaded", this._currentLevel);
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
