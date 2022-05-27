import { Level } from "./Level.js";
import { TileType } from "./schema/tileset.js";
import { Tileset, Tile, OpenableTile } from "./Tileset.js";
import { Tuple } from "./Tuple.js";


export class LevelRenderer<W extends number = number, H extends number = number> {
    readonly level: Level<W, H>;
    readonly map: Tuple<Tuple<Tile, W>, H>;
    readonly tileset: Tileset;
    readonly start: OpenableTile;
    readonly exit: OpenableTile;

    constructor(level: Level<W, H>, tileset: Tileset) {
        this.level = level;
        this.tileset = tileset;

        const mapAsTiles = level.map.map(row => row.map(char => tileset.create(char)));
        this.map = mapAsTiles as Tuple<Tuple<Tile, W>, H>;
        const start = this.map.find(row => row.find(tile => tile.type === TileType.Start))?.find(tile => tile.type === TileType.Start);
        if(start === undefined) throw new Error("No Start tile found!");
        this.start = start as OpenableTile;
        const exit = this.map.find(row => row.find(tile => tile.type === TileType.Exit))?.find(tile => tile.type === TileType.Exit);;
        if(exit === undefined) throw new Error("No Start tile found!");
        this.exit = exit as OpenableTile;
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
