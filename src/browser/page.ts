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

export interface StyleContainer {
    addStyle(id: string, cssString: string): void;
    removeStyle(id: string): void;
}

export class Page implements StyleContainer {
    static async Load(): Promise<Page> {
        await documentReady;
        return new Page();
    }
    constructor() {
        if(document.readyState === "loading") throw new Error("Document not ready! please await documentReady!");
    }
    
    status = document.getElementById<HTMLDivElement>("status") ?? notNullCoersed("#status not found!");
    lives = document.getElementById<HTMLDivElement>("lives") ?? notNullCoersed("#lives not found!");
    mapname = document.getElementById<HTMLDivElement>("mapname") ?? notNullCoersed("#mapname not found!");
    progress = document.getElementById<HTMLDivElement>("progress") ?? notNullCoersed("#progress not found!");
    info = document.getElementById<HTMLDivElement>("info") ?? notNullCoersed("#info not found!");
    content = document.getElementById<HTMLDivElement>("content") ?? notNullCoersed("#content not found!");
    root = document.body;
    worm = document.getElementById<HTMLDivElement>("worm") ?? notNullCoersed("#worm not found!");
    msgArea = document.getElementById<HTMLDivElement>("msgArea") ?? notNullCoersed("#msgArea not found!");
    
    setLives(amount: number, of: number): void {
        while(this.lives.childElementCount > of) {
            this.lives.lastElementChild?.remove();
        }
        while(this.lives.childElementCount < of) {
            this.lives.insertAdjacentHTML("afterbegin", `<span class="live sprite zelda-like-objects"></span>`);
        }
        for(let i = 0; i < of; i++) {
            const child = this.lives.children.item(i) ?? notNullCoersed(`child nr. ${i} not found in #lives`);
            if(i <  amount) {
                child.classList.add("health100");
                child.classList.remove("health0");
            } else {
                child.classList.add("health0");
                child.classList.remove("health100");
            }
        }
    }
    setProgress(n: number, of: number): void {
        this.progress.innerText = `${n}/${of}`;
    }
    setMapname(mapName: string): void {
        this.mapname.innerText = mapName;
    }

    private _createBox(classList: keyof typeof classes.msg, msg: string): HTMLDivElement {
        const box = createElement("div", {
            classList: classes.msg[classList],
            text: msg,
        });
        return box;
    }
    showInfo(msg: string): void {
        const box = this._createBox("info", msg);
        this.msgArea.insertAdjacentElement("afterbegin", box);
    }
    showWarn(msg: string): void {
        const box = this._createBox("warn", msg);
        this.msgArea.insertAdjacentElement("afterbegin", box);
    }
    showAlert(msg: string): void {
        const box = this._createBox("alert", msg);
        this.msgArea.insertAdjacentElement("afterbegin", box);
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


