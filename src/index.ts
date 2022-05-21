
export type WellKnownTiles = "#" | " " | "." | "S" | "E";
export enum TileType {
    Wall = "wall",
    Floor = "floor",
    Start = "start",
    Exit = "exit",
}

export enum TileDisplay {
    Wall = "wall",
    Floor = "floor",
    Floor2 = "floor2",
    Start = "start",
    Exit = "exit",
}

export interface Tile {
    interface: TileType,
    display: TileDisplay,
}
