import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

export class GoogleDocLoader  {
    async getContent(url, options) {
        const docId = url?.match(/\/d\/(.*?)\//)?.[1];
        const loader = new CheerioWebBaseLoader(`https://docs.google.com/document/d/${docId}/export?format=txt`);
        const docs = await loader.load();
        return docs[0].pageContent;
    }
}