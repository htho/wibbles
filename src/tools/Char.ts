export type Char = string & { type: "char"; };
export function asChar(s: string): Char {
    if (s.length !== 1)
        throw new Error(`Can not convert string to Char, lenght must be 1 but is ${s.length}!`);
    return s as Char;
}
export function asCharArray(s: string): Char[] {
    return s.split("") as Char[];
}
