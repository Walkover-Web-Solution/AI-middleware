import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { HtmlToTextTransformer } from "@langchain/community/document_transformers/html_to_text";

export class WebLoader {
    async getContent(url, options) {
        const loader = new PuppeteerWebBaseLoader(url, {
            launchOptions: {
                headless: true,
                args: ['--no-sandbox']
            },
            gotoOptions: {
                waitUntil: 'load'
            }
        });
        const docs = await loader.load();
        const transformer = new HtmlToTextTransformer();
        const textDoc = await transformer.invoke(docs);
        return textDoc[0]?.pageContent || "";
    }
}