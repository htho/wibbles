import { JsonMeta } from "./level.js"

export type JsonSpriteset = {
    $schema: string,
    meta: JsonMeta,
    
    file: string,
    widthHeight: number,

    sprites: {[name: string]: JsonSprite},
}
export type JsonSprite = JsonMultiSprite | JsonStaticSprite | JsonAnimatedSprite;
export type JsonStaticSprite = {
    index: {x: number, y: number},
}
export type JsonAnimatedSprite = {
    time: number,
    index: {x: number, y: number}[],
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