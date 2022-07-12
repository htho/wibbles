import { createElement } from "./browser/dom.js";
import { FixedSizeQueue } from "./tools/FixedSizeQueue.js";
import { finalizeDisposal, IDisposable } from "./tools/IDisposable.js";
import { Pos, Direction, nextAnmiationFrame } from "./tools/tools.js";

export class WormSegment implements IDisposable {
    readonly pos: Pos;
    tail?: WormSegment;
    readonly element: HTMLElement;
    readonly container: HTMLElement;
    private readonly segmentDistance: number;
    private readonly updateQueue: FixedSizeQueue<Pos>;
    constructor(
        position: Pos,
        container: HTMLElement,
        segmentDistance: number,
    ) {
        this.pos = {...position};
        this.container = container;
        this.element = this._render();
        this.segmentDistance = segmentDistance;
        this.updateQueue = new FixedSizeQueue(segmentDistance);
    }
    dispose(): void {
        this._isDisposed = true;
        if(this.tail) {
            this.container.removeChild(this.tail.element)
            this.tail.dispose();
        }
        finalizeDisposal(this);
    };
    protected _isDisposed = false;
    get isDisposed(): boolean {
        return this._isDisposed;
    }
    protected _render(): HTMLElement {
        const result = createElement("div", {
            classList: ["worm-segment"]
        });
        return result;
    }
    grow(): void {
        if(this.tail) {
            this.tail.grow();
            return;
        }
        this.tail = new WormSegment(
            this.pos,
            this.container,
            this.segmentDistance,
        );
        this.container.insertAdjacentElement("beforeend", this.tail.element);
    }
    
    protected updatePos({x, y}: Pos): void {
        const currentPos = {...this.pos};
        this.pos.x = x;
        this.pos.y = y;
        this.element.style.transform = `translate(${x}px, ${y}px)`;

        if(!this.tail) return;
        const nextTailPos = this.updateQueue.enqueue(currentPos);
        if(!nextTailPos) return;
        this.tail.updatePos(nextTailPos);
    }
}
export class WormHead extends WormSegment {
    readonly isHead = true;
    private _currentDirection: Direction;
    constructor(
        pos: Pos,
        direction: Direction,
        container: HTMLElement,
        segmentDistance: number,
        length: number,
        ) {
        super(
            pos,
            container,
            segmentDistance,
        );
        this._currentDirection = direction;
        this._updateRender();
        for (let i = 0; i < length; i++) {
            this.grow();
        }
    }
    private _updateRender(): void {
        this.element.classList.add("worm-head");
    }
    changeDir(dir: Direction): void {
        this._currentDirection = dir;
    }
    async nextStep(): Promise<void> {
        await this.step(this._currentDirection);
    }
    private async step(dir: Direction): Promise<void> {
        const nextPos: Pos = {...this.pos};

        if (dir === "N") nextPos.y--;
        else if (dir === "W") nextPos.x--;
        else if (dir === "S") nextPos.y++;
        else if (dir === "E") nextPos.x++;

        await nextAnmiationFrame();
        this.updatePos(nextPos);
    }

    segments(): WormSegment[] {
        const segments: WormSegment[] = [];
        let segment = this.tail;        
        while(segment !== undefined) {
            segments.push(segment);
            segment = segment.tail;
        }
        return segments;
    }

    getLastTail(): WormSegment {
        let segment: WormSegment = this;        
        while(segment?.tail) {
            segment = segment.tail;
        }
        return segment;
    }

    collides(pos: Pos, radius: number): boolean {
        if(pos.x > this.pos.x + radius) return false;
        if(pos.x < this.pos.x) return false;
        if(pos.y > this.pos.y + radius) return false;
        if(pos.y < this.pos.y) return false;
        console.log(`Worm collides ${JSON.stringify(pos)} is within ${JSON.stringify(this.pos)} + ${radius}`)
        return true;
    }
}

