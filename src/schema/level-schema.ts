
export interface Level {
    $schema: string,
    meta: Meta,
    targets: number,
    width: number,
    height: number,
    map: string[],
};

export interface Meta {
    name: string,
    author: string,
    version: number,
};
