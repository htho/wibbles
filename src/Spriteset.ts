import {
    JsonSpriteset,
    JsonSprite,
    JsonStaticSprite,
    JsonMultiSprite,
    JsonAnimatedSprite
} from "./schema/spriteset";
import { JsonMeta as JsonMeta } from "./schema/level.js";

export class Spriteset {
    readonly meta: Readonly<JsonMeta>
    readonly base: string;
    readonly file: string;
    readonly widthHeight: number;
    readonly sprites: Map<string, Sprite>;
 
    constructor(spriteset: JsonSpriteset & {base: string}) {
        this.meta = spriteset.meta;
        this.base = spriteset.base;
        this.file = spriteset.file;
        this.widthHeight = spriteset.widthHeight;
        this.sprites = this.createSprites(spriteset);
    }

    static async Load(collection: string, file: string): Promise<JsonSpriteset & {base: string}> {
        const base = `./data/sprites/${collection}`
        const fileResponse = await fetch(`${base}/${file}.json`);
        const spriteset = await fileResponse.json() as JsonSpriteset;
        return {...spriteset, base};
    }

    private createSprites(spriteset: JsonSpriteset): Map<string, Sprite> {
        const sprites = Object.entries(spriteset.sprites).map(([name, sprite]) => createSprite(name, this, sprite));
        const entries = sprites.map(sprite => [sprite.name, sprite] as const);
        return new Map(entries);
    }

    private toCss(): string {
        return `.${this.meta.name} {
            background: url(./${this.base}/${this.file});
            display: inline-block;
            height: ${this.widthHeight}px;
            width: ${this.widthHeight}px;
        }
        .stacked {
            position: absolute;
        }
        .tile-stack {
            display: inline-block;
            height: ${this.widthHeight}px;
            width: ${this.widthHeight}px;
        }
        .row {
            margin: -4px;
        }`;
        
    }

    renderCss(): HTMLElement {
        const rendered = document.createElement("style");
        rendered.innerHTML = this.fileToCssString();
        return rendered;
    }

    fileToCssString(): string {
        return [
            this.toCss(),
            ...[...this.sprites.values()].map(sprite => sprite.toCss())
        ].join("\n");
    }
}
export abstract class Sprite {
    readonly name: string;
    readonly spriteSet: Spriteset;

    constructor(name: string, spriteSet: Spriteset) {
        this.name = name;
        this.spriteSet = spriteSet;
    }

    abstract toCss(): string;
}

function createStaticOrAnimatedSprite(name: string, spriteset: Spriteset, sprite: JsonStaticSprite | JsonAnimatedSprite): StaticSprite | AnimatedSprite {
    if("time" in sprite) return new AnimatedSprite(name, spriteset, sprite);
    return new StaticSprite(name, spriteset, sprite);
}
function createSprite(name: string, spriteset: Spriteset, sprite: JsonSprite): Sprite {
    if(!("index" in sprite)) return new MultiSprite(name, spriteset, sprite);
    return createStaticOrAnimatedSprite(name, spriteset, sprite);
}
export class StaticSprite extends Sprite {
    readonly index: {x: number, y: number};

    constructor(name: string, spriteSet: Spriteset, sprite: JsonStaticSprite) {
        super(name, spriteSet);
        this.index = sprite.index;
    }

    toCss(): string {
        const xPos = this.spriteSet.widthHeight * this.index.x;
        const yPos = this.spriteSet.widthHeight * this.index.y;
        return `.${this.name} {
            background-position: -${xPos}px -${yPos}px;
        }`;
    }
}
export class AnimatedSprite extends Sprite {
    readonly sprites: StaticSprite[];

    constructor(name: string, spriteSet: Spriteset, sprite: JsonAnimatedSprite) {
        super(name, spriteSet);
        this.sprites = sprite.index.map((index, i) => new StaticSprite(`name_${i}`, spriteSet, {index}));
    }

    toCss(): string {
        return this.sprites.map(sprite => sprite.toCss()).join("\n");
    }
}
export class MultiSprite extends Sprite {
    // readonly middle?: StaticSprite | AnimatedSprite;
    /** horizontal */
    readonly H?: StaticSprite | AnimatedSprite;
    /** vertical */
    readonly V?: StaticSprite | AnimatedSprite;
    /** center */
    readonly C?: StaticSprite | AnimatedSprite;
    readonly N?: StaticSprite | AnimatedSprite;
    readonly NW?: StaticSprite | AnimatedSprite;
    readonly W?: StaticSprite | AnimatedSprite;
    readonly SW?: StaticSprite | AnimatedSprite;
    readonly S?: StaticSprite | AnimatedSprite;
    readonly SE?: StaticSprite | AnimatedSprite;
    readonly E?: StaticSprite | AnimatedSprite;
    readonly NE?: StaticSprite | AnimatedSprite;

    private readonly _sprites: (StaticSprite | AnimatedSprite)[];

    constructor(name: string, spriteSet: Spriteset, sprite: JsonMultiSprite) {
        super(name, spriteSet);

        if(sprite.H) this.H = createStaticOrAnimatedSprite(`${name}-H`, spriteSet, sprite.H);
        if(sprite.V) this.V = createStaticOrAnimatedSprite(`${name}-V`, spriteSet, sprite.V);
        if(sprite.C) this.C = createStaticOrAnimatedSprite(`${name}-C`, spriteSet, sprite.C);
        if(sprite.N) this.N = createStaticOrAnimatedSprite(`${name}-N`, spriteSet, sprite.N);
        if(sprite.NW) this.NW = createStaticOrAnimatedSprite(`${name}-NW`, spriteSet, sprite.NW);
        if(sprite.W) this.W = createStaticOrAnimatedSprite(`${name}-W`, spriteSet, sprite.W);
        if(sprite.SW) this.SW = createStaticOrAnimatedSprite(`${name}-SW`, spriteSet, sprite.SW);
        if(sprite.S) this.S = createStaticOrAnimatedSprite(`${name}-S`, spriteSet, sprite.S);
        if(sprite.SE) this.SE = createStaticOrAnimatedSprite(`${name}-SE`, spriteSet, sprite.SE);
        if(sprite.E) this.E = createStaticOrAnimatedSprite(`${name}-E`, spriteSet, sprite.E);
        if(sprite.NE) this.NE = createStaticOrAnimatedSprite(`${name}-NE`, spriteSet, sprite.NE);

        this._sprites = [this.H, this.V, this.C, this.N, this.NW, this.W, this.SW, this.S, this.SE, this.E, this.NE]
            .filter((entries): entries is NonNullable<typeof entries> => entries !== undefined);
    }

    toCss(): string {
        return this._sprites.map(sprite => sprite.toCss()).join("\n");
    }
}