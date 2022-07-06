import { Page } from "./browser/page.js";
import { Controller } from "./Controller.js";
import { Game } from "./Game.js";
import { LevelLoader } from "./Level.js";
import { SpritesetLoader } from "./Spriteset.js";
import { TilesetLoader } from "./Tileset.js";

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

const controller = new Controller({page, game});
await controller.start();

