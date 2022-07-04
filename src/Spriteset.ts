import {
    JsonSpriteset,
    JsonSprite,
    JsonStaticSprite,
    JsonMultiSprite,
    JsonAnimatedSprite,
    isJsonAnmiatedSprite,
    isJsonMultiSprite,
    isJsonStaticIndexedSprite
} from "./schema/spriteset.js";
import { JsonMeta } from "./schema/level.js";
import { Dimensions, Pos } from "./tools/tools.js";
import { createElement } from "./browser/dom.js";

export class SpriteIndex {
    private readonly _index = new Map<string, Sprite>();
    private readonly _knownSpritesets = new Set<string>();
    private readonly _spritesets = new Set<Spriteset>();

    constructor(spritesets: Spriteset[]) {
        spritesets.forEach(spriteset => this.add(spriteset));
    }

    public get spritesets(): readonly Spriteset[] {
        return [...this._spritesets];
    }

    add(spriteset: Spriteset): void {
        spriteset.sprites.forEach(sprite => this._index.set(sprite.id, sprite));
        this._knownSpritesets.add(spriteset.meta.name)
        this._spritesets.add(spriteset);
    }
    
    get(spriteId: string): Sprite {
        const sprite = this._index.get(spriteId);
        if(sprite !== undefined) return sprite;
        const {spriteset, name} = this._splitId(spriteId);
        if(!this._knownSpritesets.has(spriteset)) throw new Error(`Unknown Spriteset "${spriteset}" from given SpriteId "${spriteId}"!`);
        throw new Error(`Spriteset "${spriteset}" does not contain a Sprite named "${name}" from given SpriteId "${spriteId}"!`);
    }

    getAll(): Sprite[] {
        return [...this._index.values()];
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

export class SpritesetLoader {
    async load(spritesets: {[collection: string]: string[]}): Promise<(JsonSpriteset & {base: string})[]> {
        const filesInCollections = Object.entries(spritesets).map(([collection, files]) => files.map(file => ({collection, file}))).flat(2);
        const result = filesInCollections.map(({collection, file}) => this.loadFile(collection, file));
        return Promise.all(result);
    }
    async loadFile(collection: string, spriteset: string): Promise<JsonSpriteset & {base: string}> {
        const base = this.createBaseFromCollection(collection);
        const fileResponse = await fetch(`${base}/${spriteset}.json`);
        const jsonSpriteset = await fileResponse.json() as JsonSpriteset;
        return {...jsonSpriteset, base};
    }
    createBaseFromCollection(collection: string): string {
        const base = `./data/sprites/${collection}`;
        return base;
    }
}


export class Spriteset {
    readonly meta: Readonly<JsonMeta>
    readonly base: string;
    readonly file: string;
    readonly indexedWidthHeight: number;
    readonly sprites: Map<string, Sprite>;
    readonly styleElement: HTMLStyleElement;
    readonly cssStyle: string;
 
    constructor(spriteset: JsonSpriteset & {base: string}) {
        this.meta = spriteset.meta;
        this.base = spriteset.base;
        this.file = spriteset.file;
        this.indexedWidthHeight = spriteset.indexedWidthHeight;
        this.sprites = this._createSprites(spriteset);
        this.cssStyle = this.fileToCssString();
        this.styleElement = this.createSpriteStyleElement();
    }

    private _createSprites(spriteset: JsonSpriteset): Map<string, Sprite> {
        const sprites = Object.entries(spriteset.sprites).map(([name, sprite]) => createSprites(name, this, sprite)).flat();
        const entries = sprites.map(sprite => [sprite.name, sprite] as const);
        return new Map(entries);
    }

    public createCss(): string {
        return `.${this.meta.name} {
            background: url(./${this.base}/${this.file});
        }
        .${this.meta.name}.indexed {
            height: ${this.indexedWidthHeight}px;
            width: ${this.indexedWidthHeight}px;
        }`;
        
    }

    private createSpriteStyleElement(): HTMLStyleElement {
        const rendered = createElement("style", {
            id: `style--${this.meta.name}`,
            innerHTML: this.fileToCssString(),
        });
        return rendered;
    }

    private fileToCssString(): string {
        return [
            this.createCss(),
            ...[...this.sprites.values()].map(sprite => sprite.css)
        ].join("\n");
    }
}
export abstract class Sprite {
    readonly name: string;
    readonly spriteSet: Spriteset
    abstract readonly css: string;
    abstract readonly dimensions: Dimensions;

    readonly id: string;

    constructor(name: string, spriteSet: Spriteset) {
        this.name = name;
        this.spriteSet = spriteSet;
        this.id = `${this.spriteSet.meta.name}/${this.name}`;
    }

    createHTML(): HTMLElement {
        const result = createElement("div", {
            classList: [
                "sprite",
                this.spriteSet.meta.name,
                this.name,
            ]
        });
        return result;
    };
}

function createSprite(name: string, spriteset: Spriteset, sprite: JsonStaticSprite | JsonAnimatedSprite): Sprite {
    if(isJsonAnmiatedSprite(sprite)) return new AnimatedSprite(name, spriteset, sprite);
    return new StaticSprite(name, spriteset, sprite);
}
function createSprites(name: string, spriteset: Spriteset, sprite: JsonSprite): Sprite[] {
    if(isJsonMultiSprite(sprite)) return createSpritesForMultiSprite(name, spriteset, sprite);
    return [createSprite(name, spriteset, sprite)];
}
export class StaticSprite extends Sprite {
    readonly position: Pos;
    readonly dimensions: Dimensions;
    readonly css: string;
    readonly isIndexed: boolean;

    constructor(name: string, spriteSet: Spriteset, sprite: JsonStaticSprite) {
        super(name, spriteSet);
        
        this.isIndexed = isJsonStaticIndexedSprite(sprite);
        if(isJsonStaticIndexedSprite(sprite)) {
            this.position = {
                x: this.spriteSet.indexedWidthHeight * sprite.cell.col,
                y: this.spriteSet.indexedWidthHeight * sprite.cell.row,
            };
            this.dimensions = {
                width: spriteSet.indexedWidthHeight,
                height: spriteSet.indexedWidthHeight,
            };
        } else {
            this.position = sprite.pos;
            this.dimensions = sprite.dim;
        }

        this.css = this.createCss();
    }

    override createHTML(): HTMLElement {
        const result = super.createHTML();
        if(this.isIndexed) result.classList.add("indexed");
        return result;
    }

    private createCss(): string {
        return `.${this.spriteSet.meta.name}.${this.name} {
            background-position: -${this.position.x}px -${this.position.y}px;
        }`;
    }
}
export class AnimatedSprite extends Sprite {
    readonly dimensions: Dimensions;
    readonly frames: StaticSprite[];
    readonly time: number;
    readonly css: string;

    constructor(name: string, spriteSet: Spriteset, sprite: JsonAnimatedSprite) {
        super(name, spriteSet);
        this.time = sprite.time;
        this.frames = sprite.frames.map((frame, i) => new StaticSprite(`${name}-${i}`, spriteSet, frame));

        const firstFrame = this.frames[0];
        if(firstFrame === undefined) throw new Error(`The animation sprite ${name} has no frames. It is expected to have at least one frame!`);
        this.dimensions = firstFrame.dimensions;
        
        this.css = this.createCss();
    }

    private createCss(): string {
        return this.frames.map(frame => frame.css).join("\n");
    }

    override createHTML(): HTMLElement {
        const result = super.createHTML();
        result.classList.add("animated");
        
        const frames = this.frames.map(sprite => sprite.createHTML());
        const steps = frames.length;
        for (let index = 0; index < frames.length; index++) {
            const frame = frames[index] as HTMLElement;
            frame.classList.add("animation-frame");
            frame.classList.add("animation-frame-"+index)
            frame.style.animation = `${this.time}ms steps(${steps}) ${index * (this.time/steps)}ms infinite change-${steps}`;
            result.appendChild(frame)
        }
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
