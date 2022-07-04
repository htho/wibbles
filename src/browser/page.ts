import { createElement, documentReady } from "./dom.js";
import { notNullCoersed } from "../tools/tools.js";

export type StyleElementId = string & { type: "style#"; };

const classes = {
    msg: {
        info: ["info"],
        warn: ["warn"],
        alert: ["alert"],
    }
} as const;

export class Page {
    static async Load(): Promise<Page> {
        await documentReady;
        return new Page();
    }
    constructor() {
        if(document.readyState === "loading") throw new Error("Document not ready! please await documentReady!");
    }
    
    content = document.getElementById<HTMLDivElement>("content") ?? notNullCoersed("#content not found!");
    msgArea = document.getElementById<HTMLDivElement>("msgArea") ?? notNullCoersed("#msgArea not found!");
    

    private _createBox(classList: keyof typeof classes.msg, msg: string): HTMLDivElement {
        const box = createElement("div", {
            classList: classes.msg[classList],
            text: msg,
        });
        return box;
    }
    showInfo(msg: string): void {
        const box = this._createBox("info", msg);
        this.msgArea.appendChild(box);
    }
    showWarn(msg: string): void {
        const box = this._createBox("warn", msg);
        this.msgArea.appendChild(box);
    }
    showAlert(msg: string): void {
        const box = this._createBox("alert", msg);
        this.msgArea.appendChild(box);
    }
    addStyle(id: string, cssString: string): void {
        if(document.getElementById(id)) throw new Error(`There is already an element with the ID "${id}" in the DOM!`);
        
        const styleElement = createElement("style", {
            innerHTML: cssString,
            id
        });
        document.head.appendChild(styleElement);
    }
    removeStyle(id: string): void {
        const styleElement = document.getElementById(id);
        if(!styleElement) throw new Error(`There is no element with the given ID "${id}" in the DOM!`);
        if(!(styleElement instanceof HTMLStyleElement)) throw new Error(`The element with the given ID "${id}" in not a style element!`);
        styleElement.remove();
    }
    
}

