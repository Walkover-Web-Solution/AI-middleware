import fetch from 'node-fetch';
import mammoth from 'mammoth';
import { Document } from 'langchain/document';

export class DocxLoader {
    async getContent(url, options) {
        // Fetch the PDF from the URL
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await mammoth.extractRawText({ buffer });
        const doc = new Document({ pageContent: result.value });

        return doc.pageContent;
    }
}