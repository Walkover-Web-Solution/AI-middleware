import { sendAlert } from '../utils/utilityService.js';
import { HTMLLoader } from './html/index.js';
import { ImageLoader } from './image.js';
import { PDFLoader } from './pdf.js';

export class DocumentLoader {
    constructor() {
        this.states = {
            'default': new HTMLLoader(),
            'html': new HTMLLoader(),
            'pdf': new PDFLoader(),
            'jpeg': new ImageLoader()
        };
    }

    async getContent(url, options) {
        const parsedURL = new URL(url);
        const domain = parsedURL.hostname;
        const pathname = parsedURL.pathname;
        const extension = pathname.includes(".") ? pathname.split(".").pop() : 'html';
        if(extension && !this.states[extension]) {
            sendAlert('MISSING EXTENSION FOR RAG', {}, extension)
        }
        const loader = this.states[extension] || this.states['default'];
        return loader.getContent(url, options);
    }
}
