export class ObjectDisposedError<T extends IDisposable> extends Error {
    readonly disposedObject: T;
    constructor(obj: T, propertyOrMethod?: string) {
        super(`ObjectDisposedError: can not access property or method "${propertyOrMethod}" of disposed object!`);
        this.disposedObject = obj;
    }
}

export interface IDisposable {
    dispose(): void;
    get isDisposed(): boolean;
}

export function finalizeDisposal<T extends IDisposable>(obj: T): void {
    const descriptors = Object.getOwnPropertyDescriptors(obj);
    for(const [key, _descriptor] of Object.entries(descriptors)) {
        const d = {
            get: () => {throw new ObjectDisposedError(obj, key);},
            set: () => {throw new ObjectDisposedError(obj, key);},
        };
        Object.defineProperty(obj, key, d);
    }
    Object.defineProperty(obj, "isDisposed", {get: () => true});
}
export function notDisposed(obj: IDisposable, prop?: string) {
    if(!obj.isDisposed) return;
    throw new ObjectDisposedError(obj, prop);
}