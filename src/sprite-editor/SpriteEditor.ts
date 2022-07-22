import { createTable, documentReady, setImgSrc } from "../browser/dom.js";
import { isJsonSpriteset, JsonSpriteset, JsonStaticSprite } from "../schema/spriteset.js";
import { Sprite, Spriteset, SpritesetLoader } from "../Spriteset.js";
import { Cell, Dimensions, notNullCoersed } from "../tools/tools.js";


class Page {
    constructor(
        public spriteFileInput: HTMLInputElement,
        public spriteImage: HTMLImageElement,
        public gridBox: HTMLElement,
        public grid: HTMLElement,
        public list: HTMLElement,
        public input: HTMLInputElement,
    ) {}
        
    static async Create(): Promise<Page> {
        await documentReady;
        return new Page(
            document.getElementById<HTMLInputElement>("spriteFile") ?? notNullCoersed("#spriteFile not found!"),
            document.getElementById<HTMLImageElement>("sprite") ?? notNullCoersed("#sprite not found!"),
            document.getElementById<HTMLElement>("gridBox") ?? notNullCoersed("#gridBox not found!"),
            document.getElementById<HTMLElement>("grid") ?? notNullCoersed("#grid not found!"),
            document.getElementById<HTMLElement>("list") ?? notNullCoersed("#list not found!"),
            document.getElementById<HTMLInputElement>("input") ?? notNullCoersed("#input not found!"),
        );
    }
}

const page = await Page.Create();

page.spriteFileInput.addEventListener("input", async () => {
    const files = page.spriteFileInput.files ?? notNullCoersed("not a file input!");
    const file = files[0] ?? notNullCoersed("no file uploaded!");
    
    const parsed = JSON.parse(await file.text()) as Record<string, unknown>;
    if(!isJsonSpriteset(parsed)) throw new Error("File is not a JsonSpriteset!");

    const editor = new SpriteEditor(page, parsed);
    await editor.init();
})

const spritesetLoader = new SpritesetLoader();
    
class SpriteEditor {
    readonly spriteset: Spriteset;
    constructor(public readonly page: Page, public readonly jsonSpriteSet: JsonSpriteset) {
        this.spriteset = new Spriteset({...jsonSpriteSet, base: spritesetLoader.createBaseFromCollection(jsonSpriteSet.collection)});
    }
    inputData: JsonStaticSprite[] = [];
    async init() {
        const path = `./data/sprites/${this.jsonSpriteSet.collection}/${this.jsonSpriteSet.file}`;
        await setImgSrc(this.page.spriteImage, path);
        this.drawGrid({height: this.page.spriteImage.height, width: this.page.spriteImage.width});
        this.fillList();
    }
    gridItems: HTMLElement[][] = [];
    getGridItem(cell: Cell): HTMLElement {
        const row = this.gridItems[cell.row] ?? notNullCoersed(`row ${cell.row} not found!`);
        const el = row[cell.col] ?? notNullCoersed(`row ${cell.col} not found!`);
        return el;
    }
    drawGrid(size: Dimensions) {
        this.page.grid.style.width = this.page.gridBox.style.width = `${size.width}px`;
        this.page.grid.style.height = this.page.gridBox.style.height = `${size.height}px`;

        const baseSize = 16;
        const rows = Math.ceil(size.height / baseSize);
        const cols = Math.ceil(size.width / baseSize);
        for (let row = 0; row < rows; row++) {
            const gridRow: HTMLElement[] = [];
            for (let col = 0; col < cols; col++) {
                const gridItem = document.createElement("div");
                gridItem.classList.add("grid-item");
                gridItem.style.width = `${baseSize}px`;
                gridItem.style.height = `${baseSize}px`;
                gridItem.style.top = `${row * baseSize}px`;
                gridItem.style.left = `${col * baseSize}px`;
                gridItem.title = JSON.stringify({col, row});
                this.page.grid.appendChild(gridItem);
                gridItem.addEventListener("click", () => {
                    this.gridItemClicked(gridItem, col, row);
                });
                gridRow.push(gridItem);
            }
            this.gridItems.push(gridRow);
        }
    }
    gridItemClicked(gridItem: HTMLElement, col: number, row: number): void {
        console.log("click", gridItem, {col, row});
        const isSelected = gridItem.classList.toggle("selected");
        const jsonSprite = {cell: {col,  row}};
        if(isSelected) {
            this.inputData.push(jsonSprite)
        } else {
            this.inputData = this.inputData.filter(s => JSON.stringify(s) !== JSON.stringify(jsonSprite));
        }
        this.page.input.value = JSON.stringify(this.inputData);

    }
    fillList(): void {
        const style = document.createElement("style");
        style.innerHTML = this.spriteset.createCss();
        this.page.list.appendChild(this.spriteset.styleElement);
        
        const table = createTable({
            header: ["name", "preview"],
            data: Array.from(this.spriteset.sprites.entries()),
            dataTransform: [undefined, (sprite: Sprite): HTMLElement[] => {
                const style = document.createElement("style");
                style.innerHTML = sprite.css;
                const preview = sprite.createElement();
                return [style, preview];
            }],
        });
        this.page.list.appendChild(table);
    }
}