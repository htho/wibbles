type CbParams = (...args: any[]) => void | Promise<void>;
type CbNoParams = () => void | Promise<void>;
export type Cb = CbParams | CbNoParams;

export interface IEventEmitter<Events extends {[event: string]: Cb}> {
    on<K extends keyof Events>(event: K, cb: Events[K]): void;
    off<K extends keyof Events>(event: K, cb: Events[K]): void;
}

export class EventEmitter<Events extends {[event: string]: Cb}> implements IEventEmitter<Events> {
    private eventHandlers = new Map<keyof Events, Set<Events[keyof Events]>>();

    on<K extends keyof Events>(event: K, cb: Events[K]): void {
        const eventHandlers = this.eventHandlers.get(event) ?? new Set<Events[K]>();
        if(!this.eventHandlers.has(event)) this.eventHandlers.set(event, eventHandlers);
        
        eventHandlers.add(cb);
    }
    
    off<K extends keyof Events>(event: K, cb: Events[K]): void {
        const currentHandlers = this.eventHandlers.get(event);
        if(!currentHandlers) return;
        currentHandlers.delete(cb);
    }
    
    async emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): Promise<void> {
        const currentHandlers = this.eventHandlers.get(event);
        if(!currentHandlers) return;
        for(const cb of currentHandlers) {
            await cb(...args);
        }
    }
}
