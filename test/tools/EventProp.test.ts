import { EventProp } from "../../src/tools/EventProp";

class WithProps {
    onSomething = new EventProp<() => void>();
    onSomethingAsync = new EventProp<() => Promise<void>>();
    onSomethingWithArgs = new EventProp<(foo: string) => void>();
    onSomethingWithOptionalArgs = new EventProp<(bar?: string) => void>();
}

describe("add", () => {
    test("adds to internal list", () => {
        const c = new WithProps();
        const cb = jest.fn();
        c.onSomething.add(cb);

        expect(c.onSomething["_cbs"]).toEqual([cb]);
    });
    test("adds to internal list twice", () => {
        const c = new WithProps();
        const cb = jest.fn();
        c.onSomething.add(cb);
        c.onSomething.add(cb);

        expect(c.onSomething["_cbs"]).toEqual([cb, cb]);
    });
});
describe("delete", () => {
    test("removes from internal list", () => {
        const c = new WithProps();
        const cb = jest.fn();
        c.onSomething.add(cb);

        c.onSomething.delete(cb);

        expect(c.onSomething["_cbs"]).toEqual([]);
    });
    test("throws if not in internal list", () => {
        const c = new WithProps();
        const cb = jest.fn();

        expect(() => c.onSomething.delete(cb)).toThrowError();
    });
    test("removes from internal list once", () => {
        const c = new WithProps();
        const cb = jest.fn();
        c.onSomething.add(cb);
        c.onSomething.add(cb);

        c.onSomething.delete(cb);

        expect(c.onSomething["_cbs"]).toEqual([cb]);
    });
    test("removes from the tail", () => {
        const c = new WithProps();
        const cb = jest.fn();
        const othercb = jest.fn();
        c.onSomething.add(cb);
        c.onSomething.add(othercb);
        c.onSomething.add(cb);

        c.onSomething.delete(cb);

        expect(c.onSomething["_cbs"]).toEqual([cb, othercb]);
    });
});
describe("_emit", () => {
    test("emits", async () => {
        const c = new WithProps();
        const cb = jest.fn();
        c.onSomething.add(cb);

        await c.onSomething._emit();

        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledTimes(1);
    });
    test("emits with args", async () => {
        const c = new WithProps();
        const cb = jest.fn();
        c.onSomethingWithArgs.add(cb);

        await c.onSomethingWithArgs._emit("x");

        expect(cb).toHaveBeenCalledWith("x");
        expect(cb).toHaveBeenCalledTimes(1);
    });
    test("emits without optional args", async () => {
        const c = new WithProps();
        const cb = jest.fn();
        c.onSomethingWithOptionalArgs.add(cb);

        await c.onSomethingWithOptionalArgs._emit();

        expect(cb).toHaveBeenCalledWith();
        expect(cb).toHaveBeenCalledTimes(1);
    });
    test("emits async", async () => {
        const c = new WithProps();
        
        const cb = jest.fn();
        // // This does not work as expected!
        // // micro-tasks are only queued if an anctual promise is involved.
        // const asyncCb = async() => cb();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        const asyncCb = () => Promise.resolve().then(() => cb());
        c.onSomethingAsync.add(asyncCb);
        
        const isDoneEmitting = c.onSomethingAsync._emit();
        expect(cb).not.toHaveBeenCalled();
        
        await isDoneEmitting;

        expect(cb).toHaveBeenCalled();
    });
});