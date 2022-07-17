import { Page } from "./browser/page.js";
import { Game } from "./Game.js";
import { LevelLoader } from "./Level.js";
import { RoundFactory } from "./Round.js";
import { SpritesetLoader } from "./Spriteset.js";
import { TilesetLoader } from "./Tileset.js";

const page = await Page.Load();

const jsonGame = await Game.Load("basic");
const game = new Game(jsonGame,
{
    levelLoader: new LevelLoader(),
    tilesetLoader: new TilesetLoader(),
    spritesetLoader: new SpritesetLoader(),
    roundFactory: new RoundFactory(page),
    logger: {
        alert(msg) {
            page.showAlert(msg);
        },
        info(msg) {
            page.showInfo(msg);
        },
    }
}
);
await game.start();

