import { documentReady } from "./dom.js";
import { notNullCoersed } from "./tools.js";


export class Page {
    constructor(
        public head: HTMLHeadElement,
        public content: HTMLDivElement,
    ) {}
        
    static async Create(): Promise<Page> {
        await documentReady;
        return new Page(
            document.head,
            document.getElementById("content") ?? notNullCoersed("#content not found!"),
        );
    }
}


