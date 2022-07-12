export class FixedSizeQueue<T> {
    readonly capacity: number;
    readonly queue: T[] = [];
    constructor(capacity: number) {
        this.capacity = capacity;
    }
    get length(): number { return this.queue.length; }
    
    enqueue(el: T): undefined | T {
        const isFull = (this.queue.length >= this.capacity);
        const result = isFull ? this.queue.shift() : undefined;
        this.queue.push(el);
        return result;
    }
}