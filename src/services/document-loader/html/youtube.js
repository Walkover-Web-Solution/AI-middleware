import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";

export class YTLoader  {
    async getContent(url, options) {
        const loader = YoutubeLoader.createFromUrl(url, {
            // language: "en",
            addVideoInfo: true,
        });

        const docs = await loader.load();
        return docs[0]?.pageContent;
    }
}