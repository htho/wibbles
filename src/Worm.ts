import { createElement } from "./browser/dom.js";
import { StyleContainer } from "./browser/page.js";
import { FixedSizeQueue } from "./tools/FixedSizeQueue.js";
import { finalizeDisposal, IDisposable } from "./tools/IDisposable.js";
import { Pos, Direction } from "./tools/tools.js";

export class WormSegment implements IDisposable {
    readonly pos: Pos;
    tail?: WormSegment;
    readonly element: HTMLElement;
    readonly container: HTMLElement;
    protected readonly diameter: number;
    private readonly updateQueue: FixedSizeQueue<Pos>;
    readonly stepSize = 0.1;
    constructor(
        position: Pos,
        container: HTMLElement,
        diameter: number,
    ) {
        this.pos = {...position};
        this.container = container;
        this.element = this._render();
        this.diameter = diameter;
        const distance = this.diameter/2;
        this.updateQueue = new FixedSizeQueue(distance/this.stepSize);
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
            this.diameter,
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
    private _styleContainer: StyleContainer;
    constructor(
        pos: Pos,
        direction: Direction,
        container: HTMLElement,
        diameter: number,
        length: number,
        styleContainer: StyleContainer,
        ) {
        super(
            pos,
            container,
            diameter,
        );
        this._currentDirection = direction;
        this._styleContainer = styleContainer;

        this.changeDir(direction);

        this._updateRender();
        for (let i = 0; i < length; i++) {
            this.grow();
        }
        
        this.container.insertAdjacentElement("afterbegin", this.element);
        this._styleContainer.addStyle("worm-segment-size", this._createWormSegmentSizeCssProperty());
        
    }
    override dispose(): void {
        this._isDisposed = true;
        
        this._styleContainer.removeStyle("worm-segment-size");
        this.container.removeChild(this.element);

        super.dispose();
    };
    private _updateRender(): void {
        this.element.classList.add("worm-head");
    }
    changeDir(dir: Direction): void {
        this.element.classList.remove(`dir-${this._currentDirection}`);
        this.element.classList.add(`dir-${dir}`);
        this._currentDirection = dir;
    }
    async nextStep(): Promise<void> {
        await this.step(this._currentDirection);
    }
    private async step(dir: Direction): Promise<void> {
        const nextPos: Pos = {...this.pos};

        if (dir === "N") nextPos.y -= this.stepSize;
        else if (dir === "W") nextPos.x -= this.stepSize;
        else if (dir === "S") nextPos.y += this.stepSize;
        else if (dir === "E") nextPos.x += this.stepSize;

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

    _createWormSegmentSizeCssProperty(): string {
        return `
            :root {
                --worm-segment-size: ${this.diameter}px;
            }
        `;
    }
}

