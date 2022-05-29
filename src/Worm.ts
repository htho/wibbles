import { Pos, Direction } from "./tools";

export class Worm {
    readonly pos: Pos;
    readonly onAfterMove: (newPos: Pos) => void;
    readonly html: HTMLElement;
    length = 0;
    constructor(pos: Pos, onAfterMove: (newPos: Pos) => void, length: number) {
        this.pos = pos;
        this.onAfterMove = onAfterMove;
        this.html = this.createHTML();
        for (let i = 0; i < length; i++) {
            this.addSegment();
        }
    }

    private createHTML(): HTMLElement {
        const result = document.createElement("div");
        result.classList.add("worm");
        return result;
    }

    private createSegmentHTML(): HTMLElement {
        const result = document.createElement("div");
        result.classList.add("worm-segment");
        return result;
    }

    addSegment(): void {
        this.length++;
        const segment = this.createSegmentHTML();
        this.html.appendChild(segment);
    }

    step(dir: Direction): void {
        if (dir === "N")
            this.stepN();
        if (dir === "W")
            this.stepW();
        if (dir === "S")
            this.stepS();
        if (dir === "E")
            this.stepE();
    }
    stepN(): void {
        this.pos.y--;
        this.onAfterMove(this.pos);
    }

    stepS(): void {
        this.pos.y++;
        this.onAfterMove(this.pos);
    }

    stepE(): void {
        this.pos.x++;
        this.onAfterMove(this.pos);
    }

    stepW(): void {
        this.pos.x--;
        this.onAfterMove(this.pos);
    }
}
