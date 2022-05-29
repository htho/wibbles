import { Level } from "./Level.js";
import { TileType } from "./schema/tileset.js";
import { Tileset, Tile, OpenableTile, StartTile } from "./Tileset.js";
import { Cell, Direction, Pos, Tuple } from "./tools.js";


export class LevelRenderer<W extends number = number, H extends number = number> {
    readonly level: Level<W, H>;
    readonly map: Tuple<Tuple<Tile, W>, H>;
    readonly tileset: Tileset;
    readonly start: StartTile;
    readonly startDir: Direction;
    readonly startPos: Pos;
    readonly exit: OpenableTile;

    constructor(level: Level<W, H>, tileset: Tileset) {
        this.level = level;
        this.tileset = tileset;
        
        const mapAsTiles = level.map.map(row => row.map(char => tileset.create(char)));
        
        this.map = mapAsTiles as Tuple<Tuple<Tile, W>, H>;
        
        const start = this.map.find(row => row.find(tile => tile instanceof StartTile))?.find(tile => tile instanceof StartTile);
        if(start === undefined) throw new Error("No Start tile found!");
        this.start = start as StartTile;
        
        this.startDir = this.level.startDirection;
        this.startPos = this.findStartPos();
        
        const exit = this.map.find(row => row.find(tile => tile.type === TileType.Exit))?.find(tile => tile.type === TileType.Exit);;
        if(exit === undefined) throw new Error("No Start tile found!");
        this.exit = exit as OpenableTile;
    }
    private findCell(cell: Tile): Cell {
        const rowIndex = this.map.findIndex(row => row.includes(cell));
        const row = this.map[rowIndex];
        if(row === undefined) throw new Error(`Row #${rowIndex} not found!`);
        const col = row.indexOf(cell);
        return {row: rowIndex, col};

    }
    private findStartPos(): Pos {
        const {row, col} = this.findCell(this.start);
        const {width, height} = this.start.dimensions;
        return {
            x: (col * width) + (width / 2),
            y: (row * height) + (height / 2)
        }
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
