import { Level } from "./Level.js";
import { LevelRenderer } from "./LevelRenderer.js";
import { page } from "./page.js";
import { Tileset } from "./Tileset.js";
import { SpriteIndex, Spriteset } from "./Spriteset.js";

const basicSpriteSet = new Spriteset(await Spriteset.Load("oga--zelda-like-tilesets-and-sprites", "overworld"));

const spriteIndex = new SpriteIndex([basicSpriteSet]);

const basicTileset = new Tileset(await Tileset.Load("basic"), spriteIndex);
const emptyLevel = new Level(await Level.Load("empty"));

const emptyLevelRenderer = new LevelRenderer(emptyLevel, basicTileset);

const p = await page;

p.head.appendChild(basicSpriteSet.renderCss());
p.content.appendChild(emptyLevelRenderer.renderHtml());

