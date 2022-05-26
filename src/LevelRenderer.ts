import { Level } from "./Level.js";
import { Tileset, Tile } from "./Tileset.js";
import { Tuple } from "./Tuple.js";


export class LevelRenderer<W extends number = number, H extends number = number> {
    readonly level: Level<W, H>;
    readonly map: Tuple<Tuple<Tile, W>, H>;
    readonly tileset: Tileset;

    constructor(level: Level<W, H>, tileset: Tileset) {
        this.level = level;
        this.tileset = tileset;

        const mapAsTiles = level.map.map(row => row.map(char => tileset.create(char)));
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
        row.forEach(tile => rendered.appendChild(tile.html));
        return rendered;
    }

}
