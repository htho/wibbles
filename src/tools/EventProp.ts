import { Cb } from "./EventEmitter";

export class EventProp<THandler extends Cb> {
    private _cbs: THandler[] = [];
    add(cb: THandler): void {
        this._cbs.push(cb);
    }
    delete(cb: THandler): void {
        const idx = this._cbs.lastIndexOf(cb);
        if (idx === -1)
            throw new Error("Can not remove callback, because its not in the list of callbacks!");
        this._cbs.splice(idx, 1);
    }
    /** @internal */
    async _emit(...args: Parameters<THandler>): Promise<void> {
        for (const cb of this._cbs) {
            await cb(...args);
        }
    }
}
