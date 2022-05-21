import { Meta as JsonMeta } from "../level-schema";
import { Tile as JsonTile, TileType } from "../tileset-schema";
import { Char } from "./Char";


export class Tileset {
    readonly meta: Readonly<JsonMeta>;
    private readonly tiles: Map<Char, Tile>;
    has(char: Char): boolean { return this.tiles.has(char); }
    get(char: Char): Tile {
        if (!this.has(char))
            throw new Error(`No tile for char '${char}'!`);
        return this.tiles.get(char);
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
