import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { HtmlToTextTransformer } from "@langchain/community/document_transformers/html_to_text";

export class WebLoader {
    async getContent(url, options) {
        // Puppeteer loader initialization with increased timeout and added options
        const loader = new PuppeteerWebBaseLoader(url, {
            launchOptions: {
                timeout: 0,
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                timeout: 60000, // Increase timeout to 60 seconds
                // Uncomment and specify path if Chromium is not installed properly
                // executablePath: '/path/to/your/chromium', 
            },
            gotoOptions: {
                waitUntil: 'domcontentloaded',
                timeout: 60000, // Ensure that loading the page takes no more than 60 seconds
            }
        });

        // Load documents from the URL
        const docs = await loader.load();
        
        // Transform HTML content to text
        const transformer = new HtmlToTextTransformer();
        const textDoc = await transformer.invoke(docs);
        
        return textDoc[0]?.pageContent || "";
    }
}
