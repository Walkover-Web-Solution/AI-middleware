import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
// import ChunkService from "../dbservices/chunk";
import ChunkService  from "./ragDataService.js"
import mongoose from "mongoose";
import { deleteResourceChunks, savingVectorsInPineconeBatches } from "../services/pinecone.js";

export class Doc {
    constructor(resourceId, content, metadata = { public: false }) {
        this.content = content;
        this.resourceId = resourceId;
        this.metadata = metadata;
        this.chunks = [];
    }

    async chunk(chunkSize, overlap = 0) {
        if (!this.content) throw new Error("Content is required for chunking");
        if (!this.metadata.agentId) throw new Error("AgentId is required for chunking");
        this.chunks = [];

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: chunkSize,
            chunkOverlap: overlap,
        });
        const splits = await textSplitter.splitDocuments([{ pageContent: this.content, metadata: {} }]);
        for (const split of splits) {
            this.chunks.push({
                _id: (new mongoose.Types.ObjectId()).toString(),
                data: split.pageContent,
                resourceId: this.resourceId,
                public: this.metadata?.public,
                agentId: this.metadata.agentId,
            });
        }
        return this;
    }

    async encode(encoder) {
        const chunkTexts = this.chunks.map((chunk) => chunk.data);
        const embeddings = await encoder.encode(chunkTexts);
        this.chunks = this.chunks.map((chunk, index) => {
            chunk.data = embeddings[index];
            return chunk;
        });
        return this;
    }

    async save(storage) {
        await storage.save(this.chunks);
        return this;
    }

    async delete(storage) {
        await storage.delete(this.resourceId);
        return this;
    }
}

export class OpenAiEncoder {
    async encode(chunks) {
        return embeddings.embedDocuments(chunks);
    }
}

export class MongoStorage {
    async save(chunks) {
        return Promise.all(chunks.map(async (chunk) => await ChunkService.createChunk(chunk)));
    }

    async delete(resourceId) {
        return ChunkService.deleteChunksByResource(resourceId);
    }
}

export class PineconeStorage {
    async save(chunks) {
        let namespace = "default";
        const pineconeData = chunks.map((chunk) => {
            return {
                id: chunk._id,
                values: chunk.data,
                metadata: {
                    docId: chunk.resourceId,
                    public: chunk.public,
                    agentId: chunk.agentId
                }
            };
        });
        return savingVectorsInPineconeBatches(pineconeData, namespace);
    }

    async delete(resourceId) {
        return deleteResourceChunks("default", resourceId);
    }
}

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    batchSize: 100,
    model: 'text-embedding-3-small',
});
