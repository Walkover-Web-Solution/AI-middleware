import { WebLoader } from "./default.js";
import { GoogleDocLoader } from "./google-doc.js";
import { YTLoader } from "./youtube.js";


const HTML_LOADERS = {
    'default': new WebLoader(),
    'docs.google.com': new GoogleDocLoader(),
    'www.youtube.com': new YTLoader(),
};

export class HTMLLoader {
    constructor() {
        this.states = HTML_LOADERS;
    }

    async getContent(url, options) {
        const parsedURL = new URL(url);
        const domain = parsedURL.hostname;
        const pathname = parsedURL.pathname;
        const extension = pathname.includes(".") ? pathname.split(".").pop() : 'html';
        const loader = this.states[domain] || this.states['default'];
        console.log('loader', loader);
        return loader.getContent(url, options);
    }
}

