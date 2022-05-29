import { Worm } from "./Worm.js";
import { Direction, nextAnmiationFrame } from "./tools.js";

export class MovingWorm {
    worm: Worm;
    stepsPerSecond = 10;
    running = false;
    currentDir: Direction;
    constructor(worm: Worm, dir: Direction) {
        this.currentDir = dir;
        this.worm = worm;
    }
    async start(): Promise<void> {
        this.running = true;
        let lastStepTime = 0;
        const inteval = 1000 / this.stepsPerSecond;
        while (this.running) {
            const time = await nextAnmiationFrame();
            const timeSinceLastStep = time - lastStepTime;
            if (timeSinceLastStep < inteval)
                continue;

            lastStepTime = time;
            this.worm.step(this.currentDir);
        }
    }
    dir(dir: Direction): void {
        this.currentDir = dir;
    }
    dirN(): void {
        this.dir("N");
    }
    dirW(): void {
        this.dir("W");
    }
    dirS(): void {
        this.dir("S");
    }
    dirE(): void {
        this.dir("E");
    }
}
