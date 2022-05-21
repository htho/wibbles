import { Level as JsonLevel, Meta as JsonMeta, Meta } from "../level-schema";
import { asCharArray } from "./Char";
import { Tile, Tileset } from "./Tileset";
import { asTuple, Tuple } from "./Tuple";

export class Level<W extends number, H extends number, TileChars extends string> {
    readonly meta: Readonly<JsonMeta>;
    readonly targets: number;
    readonly width: W;
    readonly height: H;
    readonly map: Tuple<Tuple<Tile, W>, H>;

    constructor(level: JsonLevel, tileset: Tileset) {
        if(level.height !== level.map.length) throw new Error(`Unexpected height! Expected: ${level.height}. Actual: ${level.map.length}`);
        level.map.forEach((line, index) => {
            if(level.width !== line.length) throw new Error(`Unexpected line width in line ${index}! Expected: ${level.width}. Actual: ${line.length}`);
        });
        const mapAsTiles = level.map.map(row => asCharArray(row).map(char => tileset.get(char)));
        const arrayOfTupleOfTiles = mapAsTiles.map(((rowOfTiles => asTuple(rowOfTiles, this.width))));
        this.map = asTuple(arrayOfTupleOfTiles, this.height);
    }
}