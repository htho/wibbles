import { Level } from "./Level.js";
import { LevelRenderer } from "./LevelRenderer.js";
import { page } from "./page.js";
import { Tileset } from "./Tileset.js";

const basicTileset = new Tileset(await Tileset.Load("basic"));
const emptyLevel = new Level(await Level.Load("empty"));

const emptyLevelRenderer = new LevelRenderer(emptyLevel, basicTileset);
const p = await page;
p.content.appendChild(emptyLevelRenderer.renderHtml());

