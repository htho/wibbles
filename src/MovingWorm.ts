import { WormHead, WormSegment } from "./Worm.js";
import { Direction, nextAnmiationFrame, Pos } from "./tools/tools.js";
import { LevelRenderer } from "./renderer/LevelRenderer.js";
import { createElement } from "./browser/dom.js";

export class WormRenderer {
    readonly head: WormHead;
    tilesPerSecond = 1;
    readonly standardTileSize: number;
    running = false;
    readonly initialDir: Direction;
    readonly css: string;
    readonly container: HTMLElement;

    constructor(head: WormHead, levelRenderer: LevelRenderer, container: HTMLElement) {
        this.initialDir = levelRenderer.startDir;
        this.standardTileSize = levelRenderer.start.dimensions.height;
        this.head = head;
        this.container = container;
        this.css = this.createSegmentStyleCss();
    }
    async start(): Promise<void> {
        this.running = true;
        let lastStepTime = 0;
        const pxPerSecond = this.standardTileSize * this.tilesPerSecond;
        const inteval = 1000 / pxPerSecond;
        while (this.running) {
            const time = await nextAnmiationFrame();
            const timeSinceLastStep = time - lastStepTime;
            if (timeSinceLastStep < inteval)
                continue;

            lastStepTime = time;
            this.head.nextStep();
        }
    }
    private createSegmentStyleCss(): string {
        return `
            .worm-segment {
                width: ${this.standardTileSize/2}px;
                height: ${this.standardTileSize/2}px;
            }
        `;
    }
    dir(dir: Direction): void {
        this.head.changeDir(dir);
    }

    private readonly segments = new Map<WormSegment, RenderedWormSegment>();
    updateSegment(segment: WormSegment, {x, y}: Pos): void {
        const cachedRenderedSegment = this.segments.get(segment);
        const renderedSegment = (cachedRenderedSegment) ? cachedRenderedSegment : new RenderedWormSegment(segment);
        if(!cachedRenderedSegment) {
            this.segments.set(segment, renderedSegment);
            this.container.appendChild(renderedSegment.element);
        }

        renderedSegment.element.style.transform = `translate(${x}px, ${y}px)`;
    }

}

export class RenderedWormSegment {
    readonly element: HTMLElement;
    constructor(public readonly segment: WormHead | WormSegment) {
        this.element = this.renderSegment();
    }
    private renderSegment(): HTMLElement {
        const result = createElement("div", {
            classList: ["worm-segment"]
        });
        if(this.segment instanceof WormHead) {
            result.classList.add("worm-head");
        }
        return result;
    }

}