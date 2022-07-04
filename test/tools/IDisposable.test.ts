import { finalizeDisposal, IDisposable, notDisposed } from "../../src/tools/IDisposable";

class SomeDisposable implements IDisposable {
    callCb(cb: () => void): void {
        cb();
    }
    callCbDisposable(cb: () => void): void {
        notDisposed(this, "callCbDisposable");
        cb();
    }
    someProp = 42;
    get someGetter(): number {
        return this.someProp;
    }
    set someSetter(n: number) {
        this.someProp = n;
    }

    private _isDisposed = false;
    dispose(): void {
        this._isDisposed = true;

        finalizeDisposal(this);
    }
    get isDisposed(): boolean {
        return this._isDisposed;
    }
}

describe("IDisposable", () => {
    test("dispose", () => {
        const obj = new SomeDisposable();

        expect(obj.isDisposed).toBe(false);
        
        obj.dispose();
        
        expect(obj.isDisposed).toBe(true);
    });
    test("dispose finalizes prop", () => {
        const obj = new SomeDisposable();
        obj.dispose();
        
        expect(() => obj.someProp = 1).toThrowError();
    });
    test("dispose finalizes getter", () => {
        const obj = new SomeDisposable();
        obj.dispose();
        
        expect(() => obj.someGetter).toThrowError();
    });
    test("dispose finalizes setter", () => {
        const obj = new SomeDisposable();
        obj.dispose();
        
        expect(() => obj.someSetter = 1).toThrowError();
    });
    test("manually disposed method throws", () => {
        const obj = new SomeDisposable();
        const cb = jest.fn();
        
        obj.dispose();
        
        expect(() => obj.callCbDisposable(cb)).toThrowError();
        expect(cb).not.toHaveBeenCalled();
    });
    test("normal method does not throw", () => {
        const obj = new SomeDisposable();
        const cb = jest.fn();
        
        obj.dispose();
        
        expect(() => obj.callCb(cb)).not.toThrowError();
        expect(cb).toHaveBeenCalled();
    });
});