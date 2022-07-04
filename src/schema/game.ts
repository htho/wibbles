import { JsonMeta } from "./level";

export interface JsonGame {
    $schema?: string,
    meta: JsonMeta,
    level: {name: string, tileset: string}[],
    initialLives: number,
};
