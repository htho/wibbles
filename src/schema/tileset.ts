import { Meta } from "./level"

export enum TileType {
    Wall = "wall",
    Floor = "floor",
    Start = "start",
    Exit = "exit",
}

export type Tile = {
    type: TileType,
    sprite: string,
}

export type Tileset = {
    $schema: string,
    meta: Meta,
    tiles: {[char: string]: Tile},
}