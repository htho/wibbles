import { Tile } from "./schema/tileset.js";
import { Level } from "./Level.js";
import { Tileset } from "./Tileset.js";
import { Tuple } from "./Tuple.js";


export class LevelRenderer<W extends number = number, H extends number = number> {
    readonly level: Level<W, H>;
    readonly map: Tuple<Tuple<Tile, W>, H>;
    readonly tileset: Tileset;

    constructor(level: Level<W, H>, tileset: Tileset) {
        this.level = level;
        this.tileset = tileset;

        const mapAsTiles = level.map.map(row => row.map(char => tileset.get(char)));
        this.map = mapAsTiles as Tuple<Tuple<Tile, W>, H>;
    }

    renderHtml(): HTMLElement {
        const rendered = document.createElement("div");
        rendered.classList.add("map");
        const renderedRows = this.map.map(row => this.renderHtmlRow(row));
        renderedRows.forEach(renderedRow => rendered.appendChild(renderedRow));
        return rendered;

    }

    private renderHtmlRow(row: Tile[]): HTMLElement {
        const rendered = document.createElement("div");
        rendered.classList.add("row");
        const renderedTiles = row.map(tile => this.renderHtmlTile(tile));
        renderedTiles.forEach(renderedTile => rendered.appendChild(renderedTile));
        return rendered;
    }

    private renderHtmlTile(tile: Tile): HTMLElement {
        const result = document.createElement("img");
        result.classList.add("tile");
        result.src = tile.sprite;
        return result;
    }
}
