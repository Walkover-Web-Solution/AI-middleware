import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import axios from "axios";

export class PDFLoader {
    async getContent(url) {
        // Fetch the PDF from the URL
        const response = await axios.get(url, { responseType: "arraybuffer" });

        // Convert the response data to a Blob
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });

        // Load the PDF using WebPDFLoader
        const loader = new WebPDFLoader(pdfBlob, {});
        const doc = await loader.load();

        // Return the content of the first page
        const pageContents = doc.map((page) => page.pageContent);
        return pageContents.join("\n\n\n\n");
    }
}
