import { isArray, notNullCoersed, Tuple } from "../tools/tools.js";

export const documentReady = new Promise<void>((resolve) => {
    if(document.readyState === "complete") return resolve();
    document.addEventListener("readystatechange", () => {
        if(document.readyState === "complete") return resolve();
    });
});

export const setImgSrc = async (img: HTMLImageElement, src: string) => {
    return new Promise<void>((resolve, reject) => {
        img.addEventListener("error", reject);
        img.addEventListener("load", () => resolve());
        img.src = src;
    });
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    {id, text, innerHTML, classList, style}: {id?: string, text?: string, innerHTML?: string, classList?: readonly string[], style?: Partial<CSSStyleDeclaration>} = {}
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tagName);
    if(id) el.id = id;
    if(text) el.innerText = text;
    if(innerHTML) el.innerHTML = innerHTML;
    if(classList) el.classList.add(...classList);
    if(style) Object.assign(el.style, style);
    return el;
}

export function createTable<COLS extends number>({header, data, headerTransform, dataTransform} : {
    header: Tuple<unknown, COLS>,
    data: Tuple<unknown, COLS>[],
    headerTransform?: Tuple<undefined | ((cell: any) => string), COLS>,
    dataTransform?: Tuple<undefined | ((cell: any) => string | HTMLElement | HTMLElement[]), COLS>
}): HTMLTableElement {
    const table = createElement("table");
    const headerRow = createElement("tr");
    const fallbackTransform = (cell: any) => `${cell}`;
    for (let i = 0; i < header.length; i++) {
        const cell = header[i] ?? notNullCoersed("element can not be nullish!");
        const transform = (headerTransform?.[i]) ?? fallbackTransform;
        const stringCell = transform(cell);
        const th = createElement("th", {
            text: stringCell
        });
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);
    for (const dataRow of data) {
        const tr = createElement("tr");
        for (let i = 0; i < dataRow.length; i++) {
            const cell = dataRow[i];
            const transform = (dataTransform?.[i]) ?? fallbackTransform;
            const transformedCell = transform(cell);
            const td = createElement("td");
            if (typeof transformedCell === "string") td.innerText = transformedCell;
            else if (isArray(transformedCell)) td.append(...transformedCell);
            else td.append(transformedCell);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    return table;
}