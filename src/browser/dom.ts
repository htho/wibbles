import { isArray, Tuple } from "../tools/tools.js";

export const documentReady = new Promise<Document>((resolve) => {
    if(document.readyState === "complete") return resolve(document);
    document.addEventListener("readystatechange", () => {
        if(document.readyState === "complete") return resolve(document);
    });
});

export const setImgSrc = async (img: HTMLImageElement, src: string) => {
    return new Promise<void>((resolve, reject) => {
        img.addEventListener("error", reject);
        img.addEventListener("load", () => resolve());
        img.src = src;
    });
}

export function createTable<COLS extends number>({header, data, headerTransform, dataTransform} : {
    header: Tuple<any, COLS>,
    data: Tuple<any, COLS>[],
    headerTransform?: Tuple<undefined | ((cell: any) => string), COLS>,
    dataTransform?: Tuple<undefined | ((cell: any) => string | HTMLElement | HTMLElement[]), COLS>
}): HTMLTableElement {
    const table = document.createElement("table");
    const headerRow = document.createElement("tr");
    const fallbackTransform = (cell: any) => `${cell}`;
    for (let i = 0; i < header.length; i++) {
        const cell = header[i];
        const transform = (headerTransform && headerTransform[i]) ?? fallbackTransform;
        const stringCell = transform(cell);
        const th = document.createElement("th");
        th.innerText = stringCell;
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);
    for (const dataRow of data) {
        const tr = document.createElement("tr");
        for (let i = 0; i < dataRow.length; i++) {
            const cell = dataRow[i];
            const transform = (dataTransform && dataTransform[i]) ?? fallbackTransform;
            const transformedCell = transform(cell);
            const td = document.createElement("td");
            if (typeof transformedCell === "string") td.innerText = transformedCell;
            else if (isArray(transformedCell)) td.append(...transformedCell);
            else td.append(transformedCell);;
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    return table;
}