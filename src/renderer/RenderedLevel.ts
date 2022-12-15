import { StyleContainer } from "../browser/page.js";
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
    readonly styleContainer: StyleContainer;
    readonly start: StartTile;
    readonly startDir: Direction;
    readonly startPos: Pos;
    readonly exit: OpenableTile;
    readonly element: HTMLElement;
    readonly tilesize: number;
    readonly dimensions: Dimensions;

    constructor(level: Level<W, H>, tileset: Tileset, root: HTMLElement, container: HTMLElement, styleContainer: StyleContainer) {
        console.log("new RenderedLevel", {level, tileset, root, container, styleContainer});
        this.level = level;
        this.tileset = tileset;
        this.container = container;
        this.styleContainer = styleContainer;
        
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

        this.element = this._renderElement();

        this.tilesize = this.start.dimensions.height;
        this.dimensions = {
            width: this.level.cols * this.tilesize,
            height: this.level.rows * this.tilesize
        };

        this.tileset.spriteIndex.spritesets.forEach(spriteset => this.styleContainer.addStyle(spriteset.meta.name, spriteset.cssStyle));
        this.container.insertAdjacentElement("afterbegin", this.element);
        this.styleContainer.addStyle("standard-tile-size", this._createStandardTileSizeCssProperty());
        this.styleContainer.addStyle("map-width", this._createMapWidthCssProperty());
        
        root.style.scale = `${this._calcScaleToFitNicely()}`;
    }
    dispose(): void {
        console.log("dispose RenderedLevel...");
        this._isDisposed = true;
        
        this.styleContainer.removeStyle("map-width");
        this.styleContainer.removeStyle("standard-tile-size");
        this.container.removeChild(this.element);
        this.tileset.spriteIndex.spritesets.forEach(spriteset => this.styleContainer.removeStyle(spriteset.meta.name));

        finalizeDisposal(this);
        console.log("...RenderedLevel disposed!");
    }
    protected _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }
    /**
     * scale the content to fit the screen.
     * But make sure the tile size is a while number.
     * This way rendering is not screwed up on mobile.
     */
    private _calcScaleToFitNicely() {
        const availableWidth = window.innerWidth;
        const factorX = this._calcBestScale(availableWidth, this.container.clientWidth, this.tilesize);
        const statusBarHeight = this.tilesize;
        const availableHeight = window.innerHeight;
        const factorY = this._calcBestScale(availableHeight, this.container.clientHeight + statusBarHeight, this.tilesize);
        const factor = Math.min(factorX, factorY);
        return factor;
    }
    private _calcBestScale(screenSize: number, elementSize: number, tileSize: number): number {
        const theoreticalTileSpace = Math.trunc(screenSize/tileSize) * tileSize;
        const scale = theoreticalTileSpace / elementSize;
        return scale;
    }
    private _findStartPos(): Pos {
        const {x, y} = this.start.absPos;
        const {width, height} = this.tileset.tileDimensions;
        return {
            x: x + (width / 2),
            y: y + (height / 2)
        };
    }
    private _createStandardTileSizeCssProperty(): string {
        return `
            :root {
                --standard-tile-size: ${this.tilesize}px;
            }
        `;
    }
    private _createMapWidthCssProperty(): string {
        return `
            :root {
                --map-width: ${this.dimensions.width}px;
            }
        `;
    }
    private _renderElement(): HTMLElement {
        const rendered = document.createElement("div");
        rendered.classList.add("map");
        const renderedRows = this.grid.map(row => this._renderRowElements(row));
        renderedRows.forEach(renderedRow => rendered.appendChild(renderedRow));
        return rendered;
    }

    private _renderRowElements(row: Tile[]): HTMLElement {
        const rendered = document.createElement("div");
        rendered.classList.add("row");
        row.forEach(tile => rendered.appendChild(tile.element));
        return rendered;
    }

}
