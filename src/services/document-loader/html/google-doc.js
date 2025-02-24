import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { fetchCSV, getFileFormatByUrl } from "../../../utils/ragUtils.js";

export class GoogleDocLoader  {
    static format = {
        'document' : 'txt',
        'spreadsheets' : 'csv'
    }
    async getContent(url, options) {
        const docId = url?.match(/\/d\/(.*?)\//)?.[1];
        const docType = url?.match(/https:\/\/docs\.google\.com\/([^/]+)\//)?.[1]
        const docFormat = getFileFormatByUrl(url);
        const downloadUrl = `https://docs.google.com/${docType}/d/${docId}/export?format=${GoogleDocLoader.format[docType]}`
        switch(docFormat){
            case 'txt': {
                const loader = new CheerioWebBaseLoader(downloadUrl);
                const docs = await loader.load();
                return docs[0].pageContent;
            }
            case 'csv': {
                const data = await fetchCSV(downloadUrl);
                return data;
            }
        }
        
    }
}   