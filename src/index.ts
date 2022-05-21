import { Level } from "./Level";
import { LevelRenderer } from "./LevelRenderer";
import { page } from "./page";
import { Tileset } from "./Tileset";

const basicTileset = new Tileset(await Tileset.Load("basic"));
const emptyLevel = new Level(await Level.Load("empty"));

const emptyLevelRenderer = new LevelRenderer(emptyLevel, basicTileset);
const p = await page;
p.content.appendChild(emptyLevelRenderer.renderHtml());

