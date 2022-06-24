import { Level } from "./Level.js";
import { LevelRenderer } from "./LevelRenderer.js";
import { Page } from "./page.js";
import { Tileset } from "./Tileset.js";
import { SpriteIndex, Spriteset } from "./Spriteset.js";
import { WormHead } from "./Worm.js";
import { WormRenderer } from "./MovingWorm.js";
import { Points } from "./Target";

const overworld = new Spriteset(await Spriteset.Load("oga--zelda-like-tilesets-and-sprites", "overworld"));
const objects = new Spriteset(await Spriteset.Load("oga--zelda-like-tilesets-and-sprites", "objects"));

const spriteIndex = new SpriteIndex([overworld, objects]);

const basicTileset = new Tileset(await Tileset.Load("basic"), spriteIndex);

const level = new Level(await Level.Load("empty"));

export const levelRenderer = new LevelRenderer(level, basicTileset);
levelRenderer.start.open();
levelRenderer.exit.close();

export const p = await Page.Create();
p.head.appendChild(overworld.styleElement);
p.content.appendChild(levelRenderer.renderHtml());

const pts = new Points(levelRenderer);
pts.nextTarget();

const worm = new WormHead(levelRenderer.startPos, level.startDirection, (segment, pos) => {
    movingWorm.updateSegment(segment, pos);
    if(segment instanceof WormHead) {
        for(const tile of levelRenderer.list) {
            if(tile.collides(pos)) {
                throw new Error("COLLIDES with Tile");
            };
        }
        for(const segment of worm.segments()) {
            if (worm.collides(segment.pos, 0)) {
                throw new Error("COLLIDES with Worm");
            }
        }
        if(pts.currentTarget && worm.collides(pts.currentTarget.pos, 8)) {
            pts.nextTarget();
            console.log("targets left", pts.targetsLeft)
        }
        
    }
}, 30);

const movingWorm = new WormRenderer(worm, levelRenderer, p.content);
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
window.lvl = levelRenderer;

