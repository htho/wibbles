export const documentReady = new Promise<Document>((resolve) => {
    if(document.readyState === "complete") return resolve(document);
    document.addEventListener("readystatechange", () => {
        if(document.readyState === "complete") return resolve(document);
    });
});
function notNull<T>(o: T | null): T {
    if(o === null) throw new Error("object is null!");
    return o;
    
}
export const page = documentReady.then(() => ({
    content: notNull(document.getElementById("content")),
}));


