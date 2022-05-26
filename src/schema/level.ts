
export interface JsonLevel {
    $schema: string,
    meta: JsonMeta,
    targets: number,
    width: number,
    height: number,
    map: string[],
};

export interface JsonMeta {
    name: string,
    author: string,
    version: number,
};
