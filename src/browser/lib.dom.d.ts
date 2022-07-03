interface Document {
    getElementById<T extends HTMLElement>(elementId: string): T | null;
}
