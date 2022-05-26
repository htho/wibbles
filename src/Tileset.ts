import { JsonMeta } from "./schema/level.js";
import { JsonTile, TileType, JsonTileset, BasicJsonTile, OpenableJsonTile } from "./schema/tileset.js";
import { asChar, Char } from "./Char.js";


export class Tileset {
    readonly meta: Readonly<JsonMeta>;
    private readonly tiles: Map<Char, JsonTile>;
    knows(char: Char): boolean { return this.tiles.has(char); }
    create(char: Char): Tile {
        const tile = this.tiles.get(char);
        if (!tile) throw new Error(`No tile for char '${char}'!`);
        return createTile(tile);
    }
    constructor(tileset: JsonTileset) {
        this.meta = tileset.meta;
        this.tiles = new Map(Object.entries(tileset.tiles).map(([jsonChar, jsonTile]) => [asChar(jsonChar), jsonTile]));
    }

    static async Load(name: string): Promise<JsonTileset> {
        const file = await fetch(`./data/tilesets/${name}.json`);
        const tileset = await file.json() as JsonTileset;
        return tileset;
    }
}

function createTile(jsonTile: JsonTile): Tile {
    if("sprite" in jsonTile) return new BasicTile(jsonTile);
    return new OpenableTile(jsonTile);
}

export abstract class Tile {
    readonly type: TileType;
    abstract readonly html: HTMLElement;
    constructor(jsonTile: JsonTile) {
        this.type = jsonTile.type;
    }

    protected splitSprite(sprite: string): {spriteset: string, name: string} {
        const [spriteset, name, ...leftovers] = sprite.split("/");
        if(
            spriteset === undefined ||
            name === undefined ||
            leftovers.length > 0
        ) throw new Error(`Unexpected sprite format: "${sprite}"! Expected format: <spriteset>/<name>`);
        
        return {spriteset, name}
    }
    protected renderSpriteAsHtml(sprite: string | string[]): HTMLElement {
        if(typeof sprite === "string") return this.renderHtmlSingle(sprite);
        return this.renderHtmlStacked(sprite);
    }
    private renderHtmlSingle(sprite: string): HTMLElement {
        const {spriteset, name} = this.splitSprite(sprite);
        const result = document.createElement("div");
        result.classList.add("tile");
        result.classList.add(name);
        result.classList.add(spriteset);
        return result;
    }
    private renderHtmlStackItem(sprite: string): HTMLElement {
        const result = this.renderHtmlSingle(sprite);
        result.classList.add("stacked");
        return result;
    }
    private renderHtmlStacked(sprite: string[]): HTMLElement {
        const result = document.createElement("div");
        result.classList.add("tile-stack");
        const stack = sprite.map(sprite => this.renderHtmlStackItem(sprite));
        stack.forEach(el => result.appendChild(el));
        return result;
    }
};

export class BasicTile extends Tile {
    readonly sprite: string | string[];
    readonly html: HTMLElement;

    constructor(jsonTile: BasicJsonTile) {
        super(jsonTile);
        this.sprite = jsonTile.sprite;
        this.html = this.renderSpriteAsHtml(this.sprite);
    }
}

export class OpenableTile extends Tile {
    declare readonly type: TileType.Start | TileType.Exit;
    private readonly _open: string | string[];
    // private readonly _closed: string | string[];
    readonly html: HTMLElement;

    constructor(jsonTile: OpenableJsonTile) {
        super(jsonTile);
        this._open = jsonTile.open;
        this.html = this.renderSpriteAsHtml(this._open);
        // this._closed = jsonTile.closed;
        this.open();
    }

    open() {
        this.html.classList.remove("closed");
        this.html.classList.add("open");
    }
    close() {
        this.html.classList.remove("open");
        this.html.classList.add("closed");
    }
}
