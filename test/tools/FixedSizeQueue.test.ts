import { FixedSizeQueue } from "../../src/tools/FixedSizeQueue";

describe("FixedSizeQueue", () => {
    // const create = ({capacity = 2}) => jest.fn();

    test("init", () => {
        const q = new FixedSizeQueue<number>(3);
        expect(q.capacity).toBe(3);
    })

    test("enqueue increases length", () => {
        const q = new FixedSizeQueue<number>(3);
        expect(q.length).toBe(0);
        q.enqueue(3);
        expect(q.length).toBe(1);
    });
    test("enqueue returns undefined when not full", () => {
        const q = new FixedSizeQueue<number>(3);
        const result = q.enqueue(3);
        expect(result).toBeUndefined();
    });
    test("enqueue returns the first element when full", () => {
        const q = new FixedSizeQueue<number>(3);
        expect(q.enqueue(10)).toBeUndefined();
        expect(q.enqueue(11)).toBeUndefined();
        expect(q.enqueue(12)).toBeUndefined();
        expect(q.enqueue(13)).toBe(10);
        expect(q.enqueue(14)).toBe(11);
        expect(q.enqueue(15)).toBe(12);
        expect(q.enqueue(16)).toBe(13);
        expect(q.enqueue(17)).toBe(14);
    });
    test("length does not increase beyond capacity", () => {
        const q = new FixedSizeQueue<number>(3);
        expect(q.length).toBe(0);
        q.enqueue(10)
        expect(q.length).toBe(1);
        q.enqueue(11)
        expect(q.length).toBe(2);
        q.enqueue(12)
        expect(q.length).toBe(3);
        q.enqueue(13)
        expect(q.length).toBe(3);
    });
     
});