import { Pos, Direction } from "./tools";


export class WormSegment {
    readonly pos: Pos;
    readonly onAfterMove: (segment: WormSegment, newPos: Pos) => void;
    tail?: WormSegment;
    currentDirection: Direction;
    constructor(
        position: Pos,
        direction: Direction,
        onAfterMove: (segment: WormSegment, newPos: Pos) => void,
    ) {
        this.pos = {...position};
        this.currentDirection = direction;
        this.onAfterMove = onAfterMove;
    }
    grow(): void {
        if(this.tail) {
            this.tail.grow();
            return;
        }
        this.tail = new WormSegment(
            this.pos,
            this.currentDirection,
            this.onAfterMove,
        );
    }
    
    protected updatePos({x, y}: Pos): void {
        if(this.tail) this.tail.updatePos(this.pos);
        this.pos.x = x;
        this.pos.y = y;
        this.onAfterMove(this, this.pos);
    }
}
export class WormHead extends WormSegment {
    constructor(
        pos: Pos,
        direction: Direction,
        onAfterMove: (segment: WormSegment, newPos: Pos) => void,
        length: number,
        ) {
        super(
            pos,
            direction,
            onAfterMove,
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

