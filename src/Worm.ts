import { createElement } from "./browser/dom.js";
import { StyleContainer } from "./browser/page.js";
import { FixedSizeQueue } from "./tools/FixedSizeQueue.js";
import { finalizeDisposal, IDisposable } from "./tools/IDisposable.js";
import { Pos, Direction, Dimensions } from "./tools/tools.js";

export class WormSegment implements IDisposable {
    readonly pos: Pos;
    tail?: WormSegment;
    readonly element: HTMLElement;
    readonly container: HTMLElement;
    readonly radius: number;
    private readonly updateQueue: FixedSizeQueue<Pos>;
    readonly stepSize = 0.1;
    constructor(
        pos: Pos,
        container: HTMLElement,
        radius: number,
    ) {
        console.log("new WormSegment", {pos, container, radius});
        this.pos = {...pos};
        this.container = container;
        this.element = this._render();
        this.radius = radius;
        const distance = this.radius;
        this.updateQueue = new FixedSizeQueue(distance/this.stepSize);
    }
    dispose(): void {
        console.log("dispose WormSegment...");
        this._isDisposed = true;
        if(this.tail) {
            this.container.removeChild(this.tail.element);
            this.tail.dispose();
        }
        finalizeDisposal(this);
        console.log("...WormSegment disposed!");
    }
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
            this.radius,
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
        radius: number,
        length: number,
        styleContainer: StyleContainer,
        ) {
        console.log("new WormHead", {pos, direction, container, radius, length, styleContainer});
        super(
            pos,
            container,
            radius,
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
        console.log("dispose WormHead...");

        this._isDisposed = true;
        
        this._styleContainer.removeStyle("worm-segment-size");
        this.container.removeChild(this.element);

        super.dispose();
        console.log("...WormHead disposed!");
    }
    private _updateRender(): void {
        this.element.classList.add("worm-head");
    }
    changeDir(dir: Direction): void {
        this.element.classList.remove(`dir-${this._currentDirection}`);
        this.element.classList.add(`dir-${dir}`);
        this._currentDirection = dir;
    }
    nextStep(): void {
        this.step(this._currentDirection);
    }
    private step(dir: Direction): void {
        const nextPos: Pos = {...this.pos};

        if (dir === Direction.N) nextPos.y -= this.stepSize;
        else if (dir === Direction.W) nextPos.x -= this.stepSize;
        else if (dir === Direction.S) nextPos.y += this.stepSize;
        else /*if (dir === Direction.E)*/ nextPos.x += this.stepSize;

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
        while(segment.tail) {
            segment = segment.tail;
        }
        return segment;
    }

    collidesSizedBox(topLeftCorner: Pos, dimensions: Dimensions): boolean {
        return this.collidesBox(topLeftCorner, {
            x: topLeftCorner.x + dimensions.width,
            y: topLeftCorner.y + dimensions.height,
        });
    }

    collidesBox(topLeftCorner: Pos, bottomRightCorner: Pos): boolean {
        const {x, y} = this.pos;
        const {x: tx, y: ty} = topLeftCorner;
        const {x: bx, y: by} = bottomRightCorner;
        if(tx > bx || ty > by) throw new Error(`first parameter is topLeftCorner, second is bottomRightCorner!`);
         
        if(x < tx) return false;
        if(x > bx) return false;
        if(y < ty) return false;
        if(y > by) return false;
        console.log(`Worm collides ${JSON.stringify(this.pos)} is within ${JSON.stringify(topLeftCorner)} and ${JSON.stringify(bottomRightCorner)}`);
        return true;
    }
    collidesCircle(center: Pos, radius: number): boolean {
        const {x, y} = this.pos;
        const {x: cx, y: cy} = center;
        if(x < cx - radius) return false;
        if(x > cx + radius) return false;
        if(y < cy - radius) return false;
        if(y > cy + radius) return false;
        console.log(`Worm collides ${JSON.stringify(this.pos)} is within ${JSON.stringify(center)} + ${radius}`);
        return true;
    }
    collides(pos: Pos, radius: number): boolean {
        if(pos.x > this.pos.x + radius) return false;
        if(pos.x < this.pos.x) return false;
        if(pos.y > this.pos.y + radius) return false;
        if(pos.y < this.pos.y) return false;
        console.log(`Worm collides ${JSON.stringify(pos)} is within ${JSON.stringify(this.pos)} + ${radius}`);
        return true;
    }

    _createWormSegmentSizeCssProperty(): string {
        return `
            :root {
                --worm-segment-size: ${this.radius*2}px;
            }
        `;
    }
}

