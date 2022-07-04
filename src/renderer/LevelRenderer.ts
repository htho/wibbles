import { Level } from "../Level.js";
import { TileType } from "../schema/tileset.js";
import { OpenableTile, StartTile, Tile, Tileset } from "../Tileset.js";
import { Direction, Pos, Tuple } from "../tools/tools.js";

export class LevelRenderer<W extends number = number, H extends number = number> {
    readonly level: Level<W, H>;
    readonly grid: Tuple<Tuple<Tile, W>, H>;
    readonly list: Tile[];
    readonly tileset: Tileset;
    readonly start: StartTile;
    readonly startDir: Direction;
    readonly startPos: Pos;
    readonly exit: OpenableTile;
    readonly html: HTMLElement;

    constructor(level: Level<W, H>, tileset: Tileset) {
        this.level = level;
        this.tileset = tileset;
        
        const gridAsTiles = level.grid.map((row, rowNum) => row.map((char, colNum) => tileset.create(char, {x: colNum * tileset.tileDimensions.width, y: rowNum * tileset.tileDimensions.height})));
        this.grid = gridAsTiles as Tuple<Tuple<Tile, W>, H>;
        this.list = gridAsTiles.flat();

        const start = this.list.find(tile => tile instanceof StartTile);
        if(start === undefined) throw new Error("No Start tile found!");
        this.start = start as StartTile;
        
        this.startDir = this.level.startDirection;
        this.startPos = this._findStartPos();
        
        const exit = this.list.find(tile => tile.type === TileType.Exit);
        if(exit === undefined) throw new Error("No Exit tile found!");
        this.exit = exit as OpenableTile;

        this.html = this._renderHtml();
    }
    private _findStartPos(): Pos {
        const {x, y} = this.start.absPos;
        const {width, height} = this.tileset.tileDimensions;
        return {
            x: x + (width / 2),
            y: y + (height / 2)
        }
    }

    private _renderHtml(): HTMLElement {
        const rendered = document.createElement("div");
        rendered.classList.add("map");
        const renderedRows = this.grid.map(row => this._renderHtmlRow(row));
        renderedRows.forEach(renderedRow => rendered.appendChild(renderedRow));
        return rendered;
    }

    private _renderHtmlRow(row: Tile[]): HTMLElement {
        const rendered = document.createElement("div");
        rendered.classList.add("row");
        row.forEach(tile => rendered.appendChild(tile.html));
        return rendered;
    }

}