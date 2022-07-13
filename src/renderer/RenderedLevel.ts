import { Page } from "../browser/page.js";
import { Level } from "../Level.js";
import { TileType } from "../schema/tileset.js";
import { OpenableTile, StartTile, Tile, Tileset } from "../Tileset.js";
import { finalizeDisposal, IDisposable } from "../tools/IDisposable.js";
import { Dimensions, Direction, Pos, Tuple } from "../tools/tools.js";

export class RenderedLevel<W extends number = number, H extends number = number> implements IDisposable {
    readonly level: Level<W, H>;
    readonly grid: Tuple<Tuple<Tile, W>, H>;
    readonly list: Tile[];
    readonly tileset: Tileset;
    readonly container: HTMLElement;
    readonly page: Page;
    readonly start: StartTile;
    readonly startDir: Direction;
    readonly startPos: Pos;
    readonly exit: OpenableTile;
    readonly element: HTMLElement;
    readonly tilesize: number;
    readonly dimensions: Dimensions;

    constructor(level: Level<W, H>, tileset: Tileset, container: HTMLElement, page: Page) {
        this.level = level;
        this.tileset = tileset;
        this.container = container;
        this.page = page;
        
        const gridAsTiles = level.grid.map(
            (gridRow, row) => gridRow.map(
                (char, col) => tileset.create(char, {row, col})
            )
        );
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

        this.element = this._renderHtml();

        this.tilesize = this.start.dimensions.height;
        this.dimensions = {width: this.level.cols * this.tilesize, height: this.level.rows * this.tilesize};


        this.tileset.spriteIndex.spritesets.forEach(spriteset => this.page.addStyle(spriteset.meta.name, spriteset.cssStyle));
        this.container.insertAdjacentElement("afterbegin", this.element);
        this.page.addStyle("standard-tile-size", this._createStandardTileSizeCssProperty());
    }
    dispose(): void {
        this._isDisposed = true;

        this.page.removeStyle("standard-tile-size");
        this.container.removeChild(this.element);
        this.tileset.spriteIndex.spritesets.forEach(spriteset => this.page.removeStyle(spriteset.meta.name));

        finalizeDisposal(this);
    };
    protected _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }
    private _findStartPos(): Pos {
        const {x, y} = this.start.absPos;
        const {width, height} = this.tileset.tileDimensions;
        return {
            x: x + (width / 2),
            y: y + (height / 2)
        }
    }
    private _createStandardTileSizeCssProperty(): string {
        return `
            :root {
                --standard-tile-size: ${this.tilesize}px;
            }
        `;
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
