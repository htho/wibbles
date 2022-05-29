import { Level } from "./Level.js";
import { LevelRenderer } from "./LevelRenderer.js";
import { page } from "./page.js";
import { Tileset } from "./Tileset.js";
import { SpriteIndex, Spriteset } from "./Spriteset.js";
import { Worm } from "./Worm.js";
import { MovingWorm } from "./MovingWorm.js";

const basicSpriteSet = new Spriteset(await Spriteset.Load("oga--zelda-like-tilesets-and-sprites", "overworld"));

const spriteIndex = new SpriteIndex([basicSpriteSet]);

const basicTileset = new Tileset(await Tileset.Load("basic"), spriteIndex);

const emptyLevel = new Level(await Level.Load("empty"));

const emptyLevelRenderer = new LevelRenderer(emptyLevel, basicTileset);
emptyLevelRenderer.start.close();
emptyLevelRenderer.exit.open();

const p = await page;

p.head.appendChild(basicSpriteSet.styleElement);
p.content.appendChild(emptyLevelRenderer.renderHtml());
const worm = new Worm(emptyLevelRenderer.startPos, ({x, y}) => {
    worm.html.style.transform = `translate(${x}px, ${y}px)`
}, 1);
p.content.appendChild(worm.html);

const movingWorm = new MovingWorm(worm, emptyLevelRenderer.startDir);
window.addEventListener("keydown", (ev) => {
    if(ev.key === "ArrowLeft") movingWorm.dirW();
    if(ev.key === "ArrowRight") movingWorm.dirE();
    if(ev.key === "ArrowUp") movingWorm.dirN();
    if(ev.key === "ArrowDown") movingWorm.dirS();
});
movingWorm.start();

declare global {
    interface Window {
        worm: MovingWorm;
        lvl: LevelRenderer; 
    }
}
window.worm = movingWorm;
window.lvl = emptyLevelRenderer;

