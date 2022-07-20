import { Direction } from "../tools/tools";

export interface JsonLevel {
    $schema: string,
    meta: JsonMeta,
    targets: number,
    width: number,
    height: number,
    startDir: Direction,
    map: string[],
}

export interface JsonMeta {
    name: string,
    author: string,
    version: number,
}
