import { JsonMeta } from "./level.js"

export enum TileType {
    Wall = "wall",
    Floor = "floor",
    Start = "start",
    Exit = "exit",
}

export type JsonTile = BasicJsonTile | OpenableJsonTile;
export type BasicJsonTile = {
    type: TileType,
    /** name of a sprite `${spritecollection}/${spritefile}/${spritename}.${keyof MultiSprite}` */
    sprite: string | string[],
};
export type OpenableJsonTile = {
    type: TileType.Exit | TileType.Start,
    /** name of a sprite `${spritecollection}/${spritefile}/${spritename}.${keyof MultiSprite}` */
    open: string | string[],
    /** name of a sprite `${spritecollection}/${spritefile}/${spritename}.${keyof MultiSprite}` */
    closed: string | string[],
}

export type JsonTileset = {
    $schema: string,
    meta: JsonMeta,
    tiles: {[char: string]: JsonTile},
}