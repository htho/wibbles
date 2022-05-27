import { JsonMeta } from "./schema/level.js";
import { JsonTile, TileType, JsonTileset, BasicJsonTile, OpenableJsonTile } from "./schema/tileset.js";
import { asChar, Char } from "./Char.js";
import { SpriteIndex } from "./Spriteset.js";

export class Tileset {
    readonly meta: Readonly<JsonMeta>;
    private readonly tiles: Map<Char, JsonTile>;
    readonly spriteIndex: SpriteIndex;
    knows(char: Char): boolean { return this.tiles.has(char); }
    create(char: Char): Tile {
        const tile = this.tiles.get(char);
        if (!tile) throw new Error(`No tile for char '${char}'!`);
        return createTile(tile, this);
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

function createTile(jsonTile: JsonTile, tileset: Tileset): Tile {
    if("sprite" in jsonTile) return new BasicTile(jsonTile, tileset);
    return new OpenableTile(jsonTile, tileset);
}

export abstract class Tile {
    readonly type: TileType;
    readonly tileset: Tileset;
    abstract readonly html: HTMLElement;
    constructor(jsonTile: JsonTile, tileset: Tileset) {
        this.type = jsonTile.type;
        this.tileset = tileset;
    }

    protected renderSpriteAsHtml(sprite: string | string[]): HTMLElement {
        const result =  (typeof sprite === "string") ?this.renderHtmlSingle(sprite) : this.renderHtmlStacked(sprite);
        result.classList.add("tile");
        return result;
    }
    private renderHtmlSingle(spriteId: string): HTMLElement {
        const result = this.tileset.spriteIndex.get(spriteId).createHTML();
        result.classList.add("sprite");
        return result;
    }
    private renderHtmlStackItem(sprite: string): HTMLElement {
        const result = this.renderHtmlSingle(sprite);
        result.classList.add("stacked");
        return result;
    }
    private renderHtmlStacked(spriteStack: string[]): HTMLElement {
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
    readonly sprite: string | string[];
    readonly html: HTMLElement;

    constructor(jsonTile: BasicJsonTile, tileset: Tileset) {
        super(jsonTile, tileset);
        this.sprite = jsonTile.sprite;
        this.html = this.renderSpriteAsHtml(this.sprite);
    }
}

export class OpenableTile extends Tile {
    declare readonly type: TileType.Start | TileType.Exit;
    private readonly _open: string | string[];
    private readonly _closed: string | string[];
    private _isOpen = false;
    readonly html: HTMLElement;

    constructor(jsonTile: OpenableJsonTile, tileset: Tileset) {
        super(jsonTile, tileset);
        this._open = jsonTile.open;
        this._closed = jsonTile.closed;
        const htmlOpen = this.renderSpriteAsHtml(this._open);
        const htmlClosed = this.renderSpriteAsHtml(this._closed);
        this.html = document.createElement("div");
        this.html.classList.add("openable");
        this.html.classList.add("tile");
        htmlOpen.classList.add("open");
        htmlClosed.classList.add("closed");
        this.html.appendChild(htmlOpen);
        this.html.appendChild(htmlClosed);
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
