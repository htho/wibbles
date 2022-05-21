import { Meta as JsonMeta } from "./schema/level.js";
import { Tile as JsonTile, TileType, Tileset as JsonTileset } from "./schema/tileset.js";
import { asChar, Char } from "./Char.js";


export class Tileset {
    readonly meta: Readonly<JsonMeta>;
    private readonly tiles: Map<Char, Tile>;
    has(char: Char): boolean { return this.tiles.has(char); }
    get(char: Char): Tile {
        const tile = this.tiles.get(char);
        if (!tile) throw new Error(`No tile for char '${char}'!`);
        return tile;
    }
    constructor(tileset: JsonTileset) {
        this.meta = tileset.meta;
        this.tiles = new Map(Object.entries(tileset.tiles).map(([key, value]) => [asChar(key), value]));
    }

    static async Load(name: string): Promise<JsonTileset> {
        const file = await fetch(`./data/tilesets/${name}.json`);
        const tileset = await file.json() as JsonTileset;
        return tileset;
    }
}
export class Tile {
    readonly type: TileType;
    readonly sprite: string;

    constructor(jsonTile: JsonTile) {
        this.type = jsonTile.type;
        this.sprite = jsonTile.type;
    }
}
