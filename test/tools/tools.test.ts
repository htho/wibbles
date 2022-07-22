import { assertDirection } from "../../src/tools/tools"

describe("direction", () => {
    test("throws on invalid dir", () => expect(() => assertDirection("V")).toThrowError(`"V" is not a valid direction! Valid directions are: ["N","E","S","W"].`));
    test("accepts valid dir", () => expect(() => assertDirection("N")).not.toThrow());
});