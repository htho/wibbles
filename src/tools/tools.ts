export type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;

export function asTuple<T, N extends number>(arr: T[], n: N): Tuple<T, N> {
    if (arr.length !== n) throw new Error(`Length expected to be ${n}! Given array length is ${arr.length}!`);
    return arr as Tuple<T, N>;
}

export type Pos = { x: number; y: number; };
export type Dimensions = { width: number; height: number; };
export enum Direction {
    "N" = "N",
    "E" = "E",
    "S" = "S",
    "W" = "W",
}
export function assertDirection(dir: string): asserts dir is Direction {
    if(dir in Direction) return;
    throw new Error(`"${dir}" is not a valid direction! Valid directions are: ${JSON.stringify(Object.keys(Direction))}.`);
}
export type Cell = { row: number, col: number };

export function notNullCoersed(msg: string): never {
    throw new Error(msg);
}
export function assertNonNullish<T>(value: T, message: string): asserts value is NonNullable<T> {
    if (value === null || value === undefined) {
      throw Error(message);
    }
  }

export function nextAnmiationFrame(): Promise<DOMHighResTimeStamp> {
    return new Promise<DOMHighResTimeStamp>((resolve) => {
        requestAnimationFrame((time) => {
            resolve(time);
        });
    });
}
export function nextTimeout(ms = 0): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

export function isArray<T>(array: T | T[]): array is T[] {
    return Array.isArray(array);
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values_inclusive
 */
export function getRandomIntInclusive(min=0, max=1) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}
