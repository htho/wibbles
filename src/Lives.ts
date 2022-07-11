
export class Lives {
    readonly amount: number;
    left: number;

    constructor(amount: number) {
        this.amount = amount;
        this.left = amount;
    }

    decrease(): void {
        this.left--;
    }
}
