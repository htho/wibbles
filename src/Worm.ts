import type { Pos, Direction } from "./tools/tools.js";

import { SingleEventProp } from "./tools/EventProp.js";

export class WormSegment {
    readonly onAfterMove = new SingleEventProp<(head: WormSegment, newPos: Pos) => void>();
    readonly pos: Pos;
    tail?: WormSegment;
    currentDirection: Direction;
    constructor(
        position: Pos,
        direction: Direction,
    ) {
        this.pos = {...position};
        this.currentDirection = direction;
    }
    grow(): void {
        if(this.tail) {
            this.tail.grow();
            return;
        }
        this.tail = new WormSegment(
            this.pos,
            this.currentDirection,
        );
        this.tail.onAfterMove.set((head, newPos) => this.onAfterMove._emit(head, newPos));
    }
    
    protected updatePos({x, y}: Pos): void {
        if(this.tail) this.tail.updatePos(this.pos);
        this.pos.x = x;
        this.pos.y = y;
        this.onAfterMove._emit(this, this.pos);
    }
}
export class WormHead extends WormSegment {
    readonly onAfterHeadMove = new SingleEventProp<(head: WormHead, newPos: Pos) => void>();
    readonly isHead = true;
    constructor(
        pos: Pos,
        direction: Direction,
        length: number,
        ) {
        super(
            pos,
            direction,
        );
        for (let i = 0; i < length; i++) {
            this.grow();
        }
    }

    changeDir(dir: Direction): void {
        this.currentDirection = dir;
    }

    nextStep(): void {
        this.step(this.currentDirection);
    }

    protected step(dir: Direction): void {
        const nextPos: Pos = {...this.pos};

        if (dir === "N") nextPos.y--;
        else if (dir === "W") nextPos.x--;
        else if (dir === "S") nextPos.y++;
        else if (dir === "E") nextPos.x++;

        this.updatePos(nextPos);
        this.onAfterHeadMove._emit(this, nextPos);
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

    collides(pos: Pos, radius: number): boolean {
        if(pos.x > this.pos.x + radius) return false;
        if(pos.x < this.pos.x) return false;
        if(pos.y > this.pos.y + radius) return false;
        if(pos.y < this.pos.y) return false;
        return true;
    }
}

