import { JsonMeta } from "./level";

export interface JsonGame {
    $schema?: string,
    meta: JsonMeta,
    level: JsonLevel[],
    initialLives: number,
}

export type JsonLevel = {
    name: string,
    tileset: string,
}