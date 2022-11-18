import { Dimensions } from "../tools/tools.js";
import { JsonMeta } from "./level.js";

export enum TileType {
    Wall = "wall",
    Floor = "floor",
    Start = "start",
    Exit = "exit",
}

export function isBasicJsonTile(tile: JsonTile): tile is BasicJsonTile {
    return !isOpenableJsonTile(tile);
}
export function isOpenableJsonTile(tile: JsonTile): tile is OpenableJsonTile {
    if(tile.type === TileType.Exit  || tile.type === TileType.Start) return true;
    return false;
}
export function isJsonTile(tile: JsonTile): tile is OpenableJsonTile {
    if(tile.type === TileType.Exit  || tile.type === TileType.Start) return true;
    return false;
}
export function isJsonStartTile(tile: JsonTile): tile is JsonStartTile {
    if(tile.type === TileType.Start) return true;
    return false;
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
export type JsonStartTile = OpenableJsonTile & {
    type: TileType.Start,
}

export type JsonTileset = {
    $schema?: "../../schema/tileset.json",
    meta: JsonMeta,
    tileDimensions: Dimensions,
    spritesets: {[collection: string]: string[]}
    tiles: {[char: string]: JsonTile},
    /** name of a sprite `${spritecollection}/${spritefile}/${spritename}.${keyof MultiSprite}` */
    target: string,
}