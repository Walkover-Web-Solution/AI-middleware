import { sendAlert } from '../../services/utils/utility.service.js';
import { DocxLoader } from './docx.js';
import { HTMLLoader } from './html/index.js';
import { ImageLoader } from './image.js';
import { PDFLoader } from './pdf.js';
import { ScriptLoader } from './script.js';

export class DocumentLoader {
    constructor() {
        this.states = {
            'default': new HTMLLoader(),
            'html': new HTMLLoader(),
            'pdf': new PDFLoader(),
            'jpeg': new ImageLoader(), 
            'script' : new ScriptLoader(),
            'docx': new DocxLoader()
        };
    }

    async getContent(url, options) {
        const parsedURL = new URL(url);
        const domain = parsedURL.hostname;
        const pathname = parsedURL.pathname;
        let extension = 'html';
        
        if(domain === 'flow.sokt.io') {
            extension =  'script';
        }else if(pathname.includes('.')) {
            extension = pathname.split(".").pop();
        }

        if(extension && !this.states[extension]) {
            sendAlert('MISSING EXTENSION FOR RAG', {}, extension)
        }
        const loader = this.states[extension] || this.states['default'];
        return loader.getContent(url, options);
    }
}
