import { JsonLevel, JsonMeta } from "./schema/level.js";
import { asCharArray, Char } from "./tools/Char.js";
import { asTuple, Direction, Tuple } from "./tools/tools.js";

export class Level<C extends number = number, R extends number = number> {
    readonly meta: Readonly<JsonMeta>;
    readonly targets: number;
    readonly cols: C;
    readonly rows: R;
    readonly grid: Tuple<Tuple<Char, C>, R>;
    readonly startDirection: Direction;

    constructor(level: JsonLevel) {
        this.meta = level.meta;
        this.targets = level.targets;
        this.rows = level.height as R;
        this.cols = level.width as C;
        this.startDirection = level.startDir;
        
        if(level.height !== level.map.length) throw new Error(`Unexpected height! Expected: ${level.height}. Actual: ${level.map.length}`);
        
        level.map.forEach((line, index) => {
            if(level.width !== line.length) throw new Error(`Unexpected line width in line ${index}! Expected: ${level.width}. Actual: ${line.length}`);
        });
        
        const mapAsChars = level.map.map(row => asCharArray(row));
        const arrayOfTupleOfTiles = mapAsChars.map(((row => asTuple(row, this.cols))));
        this.grid = asTuple(arrayOfTupleOfTiles, this.rows);
    }
}

export class LevelLoader {
    async load(name: string): Promise<JsonLevel> {
        const file = await fetch(`./data/level/${name}.json`);
        const level = await file.json() as JsonLevel;
        return level;
    }
}