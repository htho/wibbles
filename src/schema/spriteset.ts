import { Dimensions, Pos } from "../tools/tools.js";
import { JsonMeta } from "./level.js"

export function isJsonSpriteset(obj: Record<string, unknown>): obj is JsonSpriteset {
    if (!("$schema" in obj)) return false;
    if (typeof obj["$schema"] !== "string") return false;
    return obj["$schema"] === "../../../schema/spriteset.json";
}
export type JsonSpriteset = {
    $schema: string,
    meta: JsonMeta,
    collection: string,
    file: string,
    standardSpriteSize: number,

    sprites: {[name: string]: JsonSprite},
}
export type JsonSprite = JsonMultiSprite | JsonStaticSprite | JsonAnimatedSprite;
export type JsonStaticSprite = JsonStaticIndexedSprite | JsonStaticPositionedSprite;
export type JsonStaticIndexedSprite = {
    cell: {row: number, col: number},
}
export type JsonStaticPositionedSprite = {
    pos: Pos,
    dim: Dimensions,
}
export function isJsonAnmiatedSprite(sprite: JsonSprite): sprite is JsonAnimatedSprite {
    return "frames" in sprite;
}
export function isJsonStaticIndexedSprite(sprite: JsonSprite): sprite is JsonStaticIndexedSprite {
    if ("cell" in sprite) return true;
    return false;
}
export function isJsonStaticPositionedSprite(sprite: JsonSprite): sprite is JsonStaticPositionedSprite {
    if ("pos" in sprite && "dim" in sprite) return true;
    return false;
}
export function isJsonStaticSprite(sprite: JsonSprite): sprite is JsonStaticSprite {
    if (isJsonStaticIndexedSprite(sprite)) return true;
    if (isJsonStaticPositionedSprite(sprite)) return true;
    return false;
}
export function isJsonMultiSprite(sprite: JsonSprite): sprite is JsonMultiSprite {
    if(isJsonAnmiatedSprite(sprite)) return false;
    if(isJsonStaticSprite(sprite)) return false;
    return true;
}
export type JsonAnimatedSprite = {
    time: number,
    frames: JsonStaticSprite[];
}
export type JsonMultiSprite = {
    middle?: JsonStaticSprite | JsonAnimatedSprite;
    /** horizontal */
    H?: JsonStaticSprite | JsonAnimatedSprite;
    /** vertical */
    V?: JsonStaticSprite | JsonAnimatedSprite;
    /** center */
    C?: JsonStaticSprite | JsonAnimatedSprite;
    N?: JsonStaticSprite | JsonAnimatedSprite;
    NW?: JsonStaticSprite | JsonAnimatedSprite;
    W?: JsonStaticSprite | JsonAnimatedSprite;
    SW?: JsonStaticSprite | JsonAnimatedSprite;
    S?: JsonStaticSprite | JsonAnimatedSprite;
    SE?: JsonStaticSprite | JsonAnimatedSprite;
    E?: JsonStaticSprite | JsonAnimatedSprite;
    NE?: JsonStaticSprite | JsonAnimatedSprite;
}