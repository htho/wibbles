import {
    JsonSpriteset,
    JsonSprite,
    JsonStaticSprite,
    JsonMultiSprite,
    JsonAnimatedSprite
} from "./schema/spriteset";
import { JsonMeta as JsonMeta } from "./schema/level.js";

export class SpriteIndex {
    private readonly _index = new Map<string, Sprite>();
    private readonly _knownSpritesets: Set<string>;

    constructor(spritesets: Spriteset[]) {
        spritesets.forEach(spriteset => this._indexSpriteset(spriteset));
        this._knownSpritesets = new Set(spritesets.map(spriteset => spriteset.meta.name));
    }
    
    private _indexSpriteset(spriteset: Spriteset): void {
        spriteset.sprites.forEach(sprite => this._index.set(sprite.id, sprite));
    }
    
    get(spriteId: string): Sprite {
        const sprite = this._index.get(spriteId);
        if(sprite !== undefined) return sprite;
        const {spriteset, name} = this._splitId(spriteId);
        if(!this._knownSpritesets.has(spriteset)) throw new Error(`Unknown Spriteset "${spriteset}" from given SpriteId "${spriteId}"!`);
        throw new Error(`Spriteset "${spriteset}" does not contain a Sprite named "${name}" from given SpriteId "${spriteId}"!`);
    }

    private _splitId(sprite: string): {spriteset: string, name: string} {
        const [spriteset, name, ...leftovers] = sprite.split("/");
        if(
            spriteset === undefined ||
            name === undefined ||
            leftovers.length > 0
        ) throw new Error(`Unexpected sprite format: "${sprite}"! Expected format: <spriteset>/<name>`);
        
        return {spriteset, name}
    }
}

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
        this.sprites = this._createSprites(spriteset);
    }

    static async Load(collection: string, file: string): Promise<JsonSpriteset & {base: string}> {
        const base = `./data/sprites/${collection}`
        const fileResponse = await fetch(`${base}/${file}.json`);
        const spriteset = await fileResponse.json() as JsonSpriteset;
        return {...spriteset, base};
    }

    private _createSprites(spriteset: JsonSpriteset): Map<string, Sprite> {
        const sprites = Object.entries(spriteset.sprites).map(([name, sprite]) => createSprites(name, this, sprite)).flat();
        const entries = sprites.map(sprite => [sprite.name, sprite] as const);
        return new Map(entries);
    }

    private toCss(): string {
        return `.${this.meta.name}.sprite {
            background: url(./${this.base}/${this.file});
            display: inline-block;
            height: ${this.widthHeight}px;
            width: ${this.widthHeight}px;
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
            ...[...this.sprites.values()].map(sprite => sprite.createCss())
        ].join("\n");
    }
}
export abstract class Sprite {
    readonly name: string;
    readonly spriteSet: Spriteset;

    readonly id: string;

    constructor(name: string, spriteSet: Spriteset) {
        this.name = name;
        this.spriteSet = spriteSet;
        this.id = `${this.spriteSet.meta.name}/${this.name}`;
    }

    abstract createCss(): string;
    createHTML(): HTMLElement {
        const result = document.createElement("div");
        result.classList.add("sprite");
        result.classList.add(this.spriteSet.meta.name);
        result.classList.add(this.name);
        return result;
    };
}

function createSprite(name: string, spriteset: Spriteset, sprite: JsonStaticSprite | JsonAnimatedSprite): Sprite {
    if("time" in sprite) return new AnimatedSprite(name, spriteset, sprite);
    return new StaticSprite(name, spriteset, sprite);
}
function createSprites(name: string, spriteset: Spriteset, sprite: JsonSprite): Sprite[] {
    if(!("index" in sprite)) return createSpritesForMultiSprite(name, spriteset, sprite);
    return [createSprite(name, spriteset, sprite)];
}
export class StaticSprite extends Sprite {
    readonly index: {x: number, y: number};

    constructor(name: string, spriteSet: Spriteset, sprite: JsonStaticSprite) {
        super(name, spriteSet);
        this.index = sprite.index;
    }

    createCss(): string {
        const xPos = this.spriteSet.widthHeight * this.index.x;
        const yPos = this.spriteSet.widthHeight * this.index.y;
        return `.${this.spriteSet.meta.name}.${this.name} {
            background-position: -${xPos}px -${yPos}px;
        }`;
    }
}
export class AnimatedSprite extends Sprite {
    readonly sprites: StaticSprite[];
    readonly time: number;

    constructor(name: string, spriteSet: Spriteset, sprite: JsonAnimatedSprite) {
        super(name, spriteSet);
        this.time = sprite.time;
        this.sprites = sprite.index.map((index, i) => new StaticSprite(`${name}-${i}`, spriteSet, {index}));
    }

    createCss(): string {
        return this.sprites.map(sprite => sprite.createCss()).join("\n");
    }

    override createHTML(): HTMLElement {
        const result = super.createHTML();
        result.classList.add("animated");
        
        const frames = this.sprites.map(sprite => sprite.createHTML());
        frames.forEach(frame => frame.classList.add("animation-frame"));
        frames.forEach((frame, index) => frame.classList.add("animation-frame-"+index));
        const steps = frames.length;
        frames.forEach((frame, index) => frame.style.animation = `${this.time}ms steps(${steps}) ${index * (this.time/steps)}ms infinite change-${steps}`);
        frames.forEach(frame => result.appendChild(frame));
        return result;
    };
}

function createSpritesForMultiSprite(name: string, spriteSet: Spriteset, sprite: JsonMultiSprite): Sprite[] {
    const H = (sprite.H) ? createSprite(`${name}-H`, spriteSet, sprite.H) : undefined;
    const V = (sprite.V) ? createSprite(`${name}-V`, spriteSet, sprite.V) : undefined;
    const C = (sprite.C) ? createSprite(`${name}-C`, spriteSet, sprite.C) : undefined;
    const N = (sprite.N) ? createSprite(`${name}-N`, spriteSet, sprite.N) : undefined;
    const NW = (sprite.NW) ? createSprite(`${name}-NW`, spriteSet, sprite.NW) : undefined;
    const W = (sprite.W) ? createSprite(`${name}-W`, spriteSet, sprite.W) : undefined;
    const SW = (sprite.SW) ? createSprite(`${name}-SW`, spriteSet, sprite.SW) : undefined;
    const S = (sprite.S) ? createSprite(`${name}-S`, spriteSet, sprite.S) : undefined;
    const SE = (sprite.SE) ? createSprite(`${name}-SE`, spriteSet, sprite.SE) : undefined;
    const E = (sprite.E) ? createSprite(`${name}-E`, spriteSet, sprite.E) : undefined;
    const NE = (sprite.NE) ? createSprite(`${name}-NE`, spriteSet, sprite.NE) : undefined;

    return [H, V, C, N, NW, W, SW, S, SE, E, NE]
        .filter((entries): entries is NonNullable<typeof entries> => entries !== undefined);
}
