import { Level as JsonLevel, Meta as JsonMeta } from "./schema/level-schema";
import { asCharArray, Char } from "./Char";
import { asTuple, Tuple } from "./Tuple";

export class Level<W extends number = number, H extends number = number> {
    readonly meta: Readonly<JsonMeta>;
    readonly targets: number;
    readonly width: W;
    readonly height: H;
    readonly map: Tuple<Tuple<Char, W>, H>;

    constructor(level: JsonLevel) {
        this.meta = level.meta;
        this.targets = level.targets;
        this.height = level.height as H;
        this.width = level.width as W;
        if(level.height !== level.map.length) throw new Error(`Unexpected height! Expected: ${level.height}. Actual: ${level.map.length}`);
        level.map.forEach((line, index) => {
            if(level.width !== line.length) throw new Error(`Unexpected line width in line ${index}! Expected: ${level.width}. Actual: ${line.length}`);
        });
        
        const mapAsChars = level.map.map(row => asCharArray(row));
        const arrayOfTupleOfTiles = mapAsChars.map(((row => asTuple(row, this.width))));
        this.map = asTuple(arrayOfTupleOfTiles, this.height);
    }

    static async Load(name: string): Promise<JsonLevel> {
        const file = await fetch(`./data/level/${name}.json`);
        const level = await file.json() as JsonLevel;
        return level;
    }
}