import { Level } from "./Level.js";
import { LevelRenderer } from "./LevelRenderer.js";
import { page } from "./page.js";
import { Tileset } from "./Tileset.js";
import { SpriteIndex, Spriteset } from "./Spriteset.js";
import { WormHead } from "./Worm.js";
import { WormRenderer } from "./MovingWorm.js";

const basicSpriteSet = new Spriteset(await Spriteset.Load("oga--zelda-like-tilesets-and-sprites", "overworld"));

const spriteIndex = new SpriteIndex([basicSpriteSet]);

const basicTileset = new Tileset(await Tileset.Load("basic"), spriteIndex);

const emptyLevel = new Level(await Level.Load("empty"));

const emptyLevelRenderer = new LevelRenderer(emptyLevel, basicTileset);
emptyLevelRenderer.start.open();
emptyLevelRenderer.exit.close();

const p = await page;

p.head.appendChild(basicSpriteSet.styleElement);
p.content.appendChild(emptyLevelRenderer.renderHtml());
const worm = new WormHead(emptyLevelRenderer.startPos, emptyLevel.startDirection, (segment, pos) => {
    movingWorm.updateSegment(segment, pos);
    if(segment instanceof WormHead) {
        for(const tile of emptyLevelRenderer.list) {
            if(tile.collides(pos)) {
                throw new Error("COLLIDES");
            };
        }
    }
}, 30);

const movingWorm = new WormRenderer(worm, emptyLevelRenderer, p.content);
p.head.appendChild(movingWorm.styleElement);
window.addEventListener("keydown", (ev) => {
    if(ev.key === "ArrowLeft") movingWorm.dir("W");
    if(ev.key === "ArrowRight") movingWorm.dir("E");
    if(ev.key === "ArrowUp") movingWorm.dir("N");
    if(ev.key === "ArrowDown") movingWorm.dir("S");
});
movingWorm.start();

declare global {
    interface Window {
        worm: WormRenderer;
        lvl: LevelRenderer; 
    }
}
window.worm = movingWorm;
window.lvl = emptyLevelRenderer;

