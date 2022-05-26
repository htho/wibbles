import { Level } from "./Level.js";
import { LevelRenderer } from "./LevelRenderer.js";
import { page } from "./page.js";
import { Tileset } from "./Tileset.js";
import { Spriteset } from "./Spriteset.js";

const basicSpriteSet = new Spriteset(await Spriteset.Load("oga--zelda-like-tilesets-and-sprites", "overworld"));

const basicTileset = new Tileset(await Tileset.Load("basic"));
const emptyLevel = new Level(await Level.Load("empty"));

const emptyLevelRenderer = new LevelRenderer(emptyLevel, basicTileset);

const p = await page;

p.head.appendChild(basicSpriteSet.renderCss());
p.content.appendChild(emptyLevelRenderer.renderHtml());

