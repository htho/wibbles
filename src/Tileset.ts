import { JsonMeta } from "./schema/level.js";
import { JsonTile, TileType, JsonTileset, BasicJsonTile, OpenableJsonTile, isBasicJsonTile, JsonStartTile, isJsonStartTile } from "./schema/tileset.js";
import { asChar, Char } from "./tools/Char.js";
import { Sprite, SpriteIndex } from "./Spriteset.js";
import { Cell, Dimensions, isArray, Pos } from "./tools/tools.js";
import { createElement } from "./browser/dom.js";

export class Tileset {
    readonly meta: Readonly<JsonMeta>;
    private readonly tiles: Map<Char, JsonTile>;
    readonly spriteIndex: SpriteIndex;
    readonly tileDimensions: Dimensions;
    knows(char: Char): boolean { return this.tiles.has(char); }
    create(char: Char, {row, col}: Cell): Tile {
        const tile = this.tiles.get(char);
        if (!tile) throw new Error(`No tile for char '${char}'!`);
        const {width, height} = this.tileDimensions;
        const absPos = {x: col * width, y: row * height};
        return createTile(tile, this, char, absPos);
    }
    constructor(tileset: JsonTileset, spriteIndex: SpriteIndex) {
        this.meta = tileset.meta;
        this.spriteIndex = spriteIndex;
        this.tileDimensions = tileset.tileDimensions;
        this.tiles = new Map(Object.entries(tileset.tiles).map(([jsonChar, jsonTile]) => [asChar(jsonChar), jsonTile]));
    }
}

export class TilesetLoader {
    async load(name: string): Promise<JsonTileset> {
        const file = await fetch(`./data/tilesets/${name}.json`);
        const tileset = await file.json() as JsonTileset;
        return tileset;
    }
}

function createTile(jsonTile: JsonTile, tileset: Tileset, char: Char, absPos: Pos): Tile {
    if(isBasicJsonTile(jsonTile)) return new BasicTile(jsonTile, tileset, char, absPos);
    if(isJsonStartTile(jsonTile)) return new StartTile(jsonTile, tileset, char, absPos);
    return new OpenableTile(jsonTile, tileset, char, absPos);
}

export abstract class Tile {
    readonly type: TileType;
    readonly tileset: Tileset;
    readonly char: Char;
    readonly absPos: Pos;
    readonly isSolid: boolean;
    abstract readonly dimensions: Dimensions;
    abstract readonly element: HTMLElement;
    
    constructor(jsonTile: JsonTile, tileset: Tileset, char: Char, absPos: Pos) {
        this.type = jsonTile.type;
        this.isSolid = this.type !== TileType.Floor;
        this.tileset = tileset;
        this.char = char;
        this.absPos = absPos;
    }

    protected jsonSpriteToSprite(sprite: string | string[]): Sprite | Sprite[] {
        if (!isArray(sprite)) return this.tileset.spriteIndex.get(sprite);
        return sprite.map(s => this.tileset.spriteIndex.get(s));
    }
    protected getBaseSprite(sprite: Sprite | Sprite[]): Sprite {
        if(!isArray(sprite)) return sprite;
        const firstSprite = sprite[0];
        if(firstSprite === undefined) throw new Error(`The stakced Tile for the Char '${this.char}' has no Sprites. It is expected to have at least one Sprite!`);
        return firstSprite;
    }
    protected getSpriteDimensions(sprite: Sprite | Sprite[]): Dimensions {
        return this.getBaseSprite(sprite).dimensions;
    }

    protected renderElement(sprite: Sprite | Sprite[]): HTMLElement {
        const result = isArray(sprite) ? this.renderStackedElement(sprite) : this.renderSingleElement(sprite);
        result.classList.add("tile");
        return result;
    }
    private renderSingleElement(sprite: Sprite): HTMLElement {
        const result = sprite.createElement();
        result.classList.add("sprite");
        return result;
    }
    private renderStackItemElement(sprite: Sprite): HTMLElement {
        const result = this.renderSingleElement(sprite);
        result.classList.add("stacked");
        return result;
    }
    private renderStackedElement(spriteStack: Sprite[]): HTMLElement {
        const [first, ...others] = spriteStack;
        if(first === undefined) throw new Error("Unexpected empty sprite stack!");

        const result = this.renderSingleElement(first);
        result.classList.add("stack");
        const stack = others.map(sprite => this.renderStackItemElement(sprite));
        stack.forEach(el => result.appendChild(el));
        return result;
    }

    get posOfOtherEdge(): Pos {
        return {
            x: this.absPos.x + this.dimensions.width,
            y: this.absPos.y + this.dimensions.height
        };
    }

    collides(pos: Pos): boolean {
        if(!this.isSolid) return false;

        if(pos.x < this.absPos.x) return false;
        if(pos.y < this.absPos.y) return false;
        const posOfOtherEdge = this.posOfOtherEdge;
        if(pos.x > posOfOtherEdge.x) return false;
        if(pos.y > posOfOtherEdge.y) return false;
        return true;
    } 
}

export class BasicTile extends Tile {
    readonly sprite: Sprite | Sprite[];
    readonly element: HTMLElement;
    readonly dimensions: Dimensions;

    constructor(jsonTile: BasicJsonTile, tileset: Tileset, char: Char, absPos: Pos) {
        super(jsonTile, tileset, char, absPos);
        this.sprite = this.jsonSpriteToSprite(jsonTile.sprite);
        this.dimensions = this.getSpriteDimensions(this.sprite);
        this.element = this.renderElement(this.sprite);
    }
}

export class OpenableTile extends Tile {
    declare readonly type: TileType.Start | TileType.Exit;
    private readonly _open: Sprite | Sprite[];
    private readonly _closed: Sprite | Sprite[];
    private _isOpen = false;
    get isOpen() {
        return this._isOpen;
    }
    readonly element: HTMLElement;
    readonly dimensions: Dimensions;

    constructor(jsonTile: OpenableJsonTile, tileset: Tileset, char: Char, absPos: Pos) {
        super(jsonTile, tileset, char, absPos);
        this._open = this.jsonSpriteToSprite(jsonTile.open);
        this._closed = this.jsonSpriteToSprite(jsonTile.closed);
        const closedElement = this.renderElement(this._open);
        const openElement = this.renderElement(this._closed);
        this.element = createElement("div", {
            classList: [
                "openable",
                "tile",
            ]
        });
        closedElement.classList.add("open");
        openElement.classList.add("closed");
        this.element.appendChild(closedElement);
        this.element.appendChild(openElement);
        const baseOpen = this.getBaseSprite(this._open);
        const baseClosed = this.getBaseSprite(this._closed);
        const openAndClosedDimensionsAreEqual = baseOpen.dimensions.height === baseClosed.dimensions.height && baseOpen.dimensions.width === baseClosed.dimensions.width;
        if(!openAndClosedDimensionsAreEqual) throw new Error(`Open and Closed do not have the same Dimensions in the first sprite. The first sprites Dimensions must be equal!`);
        this.dimensions = baseClosed.dimensions;
        this.open();
    }

    override collides(pos: Pos): boolean {
        if (this._isOpen) return false;
        return super.collides(pos);
    }
    collidesRegardlessOfState(pos: Pos): boolean {
        return super.collides(pos);
    }

    open() {
        this._isOpen = true;
        this.element.classList.add("is-open");
    }
    close() {
        this._isOpen = false;
        this.element.classList.remove("is-open");
    }
}

export class StartTile extends OpenableTile {
    constructor(jsonTile: JsonStartTile, tileset: Tileset, char: Char, absPos: Pos) {
        super(jsonTile, tileset, char, absPos);
    }
}