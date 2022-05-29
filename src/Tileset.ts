import { JsonMeta } from "./schema/level.js";
import { JsonTile, TileType, JsonTileset, BasicJsonTile, OpenableJsonTile, isBasicJsonTile, JsonStartTile, isJsonStartTile } from "./schema/tileset.js";
import { asChar, Char } from "./Char.js";
import { Sprite, SpriteIndex } from "./Spriteset.js";
import { Dimensions, isArray } from "./tools.js";

export class Tileset {
    readonly meta: Readonly<JsonMeta>;
    private readonly tiles: Map<Char, JsonTile>;
    readonly spriteIndex: SpriteIndex;
    knows(char: Char): boolean { return this.tiles.has(char); }
    create(char: Char): Tile {
        const tile = this.tiles.get(char);
        if (!tile) throw new Error(`No tile for char '${char}'!`);
        return createTile(tile, this, char);
    }
    constructor(tileset: JsonTileset, spriteIndex: SpriteIndex) {
        this.meta = tileset.meta;
        this.spriteIndex = spriteIndex;
        this.tiles = new Map(Object.entries(tileset.tiles).map(([jsonChar, jsonTile]) => [asChar(jsonChar), jsonTile]));
    }

    static async Load(name: string): Promise<JsonTileset> {
        const file = await fetch(`./data/tilesets/${name}.json`);
        const tileset = await file.json() as JsonTileset;
        return tileset;
    }
}

function createTile(jsonTile: JsonTile, tileset: Tileset, char: Char): Tile {
    if(isBasicJsonTile(jsonTile)) return new BasicTile(jsonTile, tileset, char);
    if(isJsonStartTile(jsonTile)) return new StartTile(jsonTile, tileset, char);
    return new OpenableTile(jsonTile, tileset, char);
}

export abstract class Tile {
    readonly type: TileType;
    readonly tileset: Tileset;
    readonly char: Char;
    abstract readonly dimensions: Dimensions;
    abstract readonly html: HTMLElement;
    
    constructor(jsonTile: JsonTile, tileset: Tileset, char: Char) {
        this.type = jsonTile.type;
        this.tileset = tileset;
        this.char = char;
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

    protected renderHtml(sprite: Sprite | Sprite[]): HTMLElement {
        const result = isArray(sprite) ? this.renderHtmlStacked(sprite) : this.renderHtmlSingle(sprite);
        result.classList.add("tile");
        return result;
    }
    private renderHtmlSingle(sprite: Sprite): HTMLElement {
        const result = sprite.createHTML();
        result.classList.add("sprite");
        return result;
    }
    private renderHtmlStackItem(sprite: Sprite): HTMLElement {
        const result = this.renderHtmlSingle(sprite);
        result.classList.add("stacked");
        return result;
    }
    private renderHtmlStacked(spriteStack: Sprite[]): HTMLElement {
        const [first, ...others] = spriteStack;
        if(first === undefined) throw new Error("Unexpected empty sprite stack!");

        const result = this.renderHtmlSingle(first);
        result.classList.add("stack");
        const stack = others.map(sprite => this.renderHtmlStackItem(sprite));
        stack.forEach(el => result.appendChild(el));
        return result;
    }
};

export class BasicTile extends Tile {
    readonly sprite: Sprite | Sprite[];
    readonly html: HTMLElement;
    readonly dimensions: Dimensions;

    constructor(jsonTile: BasicJsonTile, tileset: Tileset, char: Char) {
        super(jsonTile, tileset, char);
        this.sprite = this.jsonSpriteToSprite(jsonTile.sprite);
        this.dimensions = this.getSpriteDimensions(this.sprite);
        this.html = this.renderHtml(this.sprite);
    }
}

export class OpenableTile extends Tile {
    declare readonly type: TileType.Start | TileType.Exit;
    private readonly _open: Sprite | Sprite[];
    private readonly _closed: Sprite | Sprite[];
    private _isOpen = false;
    readonly html: HTMLElement;
    readonly dimensions: Dimensions;

    constructor(jsonTile: OpenableJsonTile, tileset: Tileset, char: Char) {
        super(jsonTile, tileset, char);
        this._open = this.jsonSpriteToSprite(jsonTile.open);
        this._closed = this.jsonSpriteToSprite(jsonTile.closed);
        const htmlOpen = this.renderHtml(this._open);
        const htmlClosed = this.renderHtml(this._closed);
        this.html = document.createElement("div");
        this.html.classList.add("openable");
        this.html.classList.add("tile");
        htmlOpen.classList.add("open");
        htmlClosed.classList.add("closed");
        this.html.appendChild(htmlOpen);
        this.html.appendChild(htmlClosed);
        const baseOpen = this.getBaseSprite(this._open);
        const baseClosed = this.getBaseSprite(this._closed);
        const openAndClosedDimensionsAreEqual = baseOpen.dimensions.height === baseClosed.dimensions.height && baseOpen.dimensions.width === baseClosed.dimensions.width;
        if(!openAndClosedDimensionsAreEqual) throw new Error(`Open and Closed do not have the same Dimensions in the first sprite. The first sprites Dimensions must be equal!`);
        this.dimensions = baseClosed.dimensions;
        this.open();
    }

    get collides(): boolean {
        return !this._isOpen;
    }

    open() {
        this._isOpen = true;
        this.html.classList.add("is-open");
    }
    close() {
        this._isOpen = false;
        this.html.classList.remove("is-open");
    }
}

export class StartTile extends OpenableTile {
    constructor(jsonTile: JsonStartTile, tileset: Tileset, char: Char) {
        super(jsonTile, tileset, char);
    }
}