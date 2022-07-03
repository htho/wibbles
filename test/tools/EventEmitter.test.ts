import { EventEmitter } from "../../src/tools/EventEmitter";

describe("on", () => {
    test("adds to internal list", () => {
        const e = new EventEmitter();
        const cb = () => {};
        e.on("foo", cb);

        expect(e["eventHandlers"].has("foo")).toBe(true);
        expect(e["eventHandlers"].get("foo")?.has(cb)).toBe(true);
    });
});
describe("off", () => {
    test("removes from internal list", () => {
        const e = new EventEmitter();
        const cb = () => {};
        e.on("foo", cb);

        e.off("foo", cb);
        expect(e["eventHandlers"].has("foo")).toBe(true);
        expect(e["eventHandlers"].get("foo")?.has(cb)).toBe(false);
    });
});
describe("emit", () => {
    test("emits asynchronously", async () => {
        const e = new EventEmitter();
        const asyncCbMock = jest.fn();
        const asyncCb = Promise.resolve().then(() => asyncCbMock());
        e.on("foo", async () => await asyncCb);

        const emitted = e.emit("foo");
        expect(asyncCbMock).not.toHaveBeenCalled();
        await emitted;
        expect(asyncCbMock).toHaveBeenCalled();
    });
});