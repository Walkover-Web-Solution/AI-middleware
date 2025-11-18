import { QdrantClient } from '@qdrant/js-client-rest';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

class QdrantService {
    constructor() {
        // Initialize Qdrant client
        // You can configure this via environment variables
        this.client = new QdrantClient({
            url: process.env.QDRANT_URL || 'http://localhost:6333',
            apiKey: process.env.QDRANT_API_KEY || undefined,
        });
        this.collectionName = process.env.QDRANT_COLLECTION || 'documents';
        
        // Initialize OpenAI client for direct embedding generation
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.embeddingModel = 'text-embedding-3-small';
    }

    /**
     * Generate embeddings using OpenAI API directly
     * @param {string|Array<string>} texts - Single text or array of texts to embed
     * @returns {Promise<Array<number>|Array<Array<number>>>} Single embedding or array of embeddings
     */
    async generateEmbeddings(texts) {
        try {
            const input = Array.isArray(texts) ? texts : [texts];
            
            const response = await this.openai.embeddings.create({
                model: this.embeddingModel,
                input: input,
            });

            const embeddings = response.data.map(item => item.embedding);
            
            // Return single embedding if single text was provided, otherwise return array
            return Array.isArray(texts) ? embeddings : embeddings[0];
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw error;
        }
    }

    /**
     * Ensure collection exists, create if it doesn't
     */
    async ensureCollection(collectionName, vectorSize = 1536) {
        try {
            const collections = await this.client.getCollections();
            const collectionExists = collections.collections.some(
                (col) => col.name === collectionName
            );

            if (!collectionExists) {
                await this.client.createCollection(collectionName, {
                    vectors: {
                        size: vectorSize,
                        distance: 'Cosine',
                    },
                });
                console.log(`Collection ${collectionName} created successfully`);
            }
        } catch (error) {
            console.error('Error ensuring collection:', error);
            throw error;
        }
    }

    /**
     * Save vectors to Qdrant
     * @param {Array} chunks - Array of text chunks
     * @param {string} namespace - Optional namespace (collection name)
     * @param {Object} metadata - Additional metadata to store with vectors
     * @returns {Promise<Array>} Array of point IDs
     */
    async saveVectors(chunks, namespace = null, metadata = {}) {
        try {
            const collectionName = namespace || this.collectionName;
            
            // Generate embeddings for all chunks using OpenAI directly
            const embeddingsList = await this.generateEmbeddings(chunks);
            
            // Ensure collection exists (assuming text-embedding-3-small produces 1536 dimensions)
            await this.ensureCollection(collectionName, embeddingsList[0]?.length || 1536);

            // Prepare points for Qdrant
            const points = embeddingsList.map((embedding, index) => ({
                id: this.generateUniqueId(),
                vector: embedding,
                payload: {
                    text: chunks[index],
                    ...metadata,
                    chunk_index: index,
                    created_at: new Date().toISOString(),
                },
            }));

            // Upsert points in batches
            const batchSize = 100;
            const pointIds = [];

            for (let i = 0; i < points.length; i += batchSize) {
                const batch = points.slice(i, i + batchSize);
                await this.client.upsert(collectionName, {
                    wait: true,
                    points: batch,
                });
                pointIds.push(...batch.map((p) => p.id));
            }

            return pointIds;
        } catch (error) {
            console.error('Error saving vectors to Qdrant:', error);
            throw error;
        }
    }

    /**
     * Query Qdrant for similar vectors
     * @param {string} queryText - Query text to search for
     * @param {number} topK - Number of top results to return
     * @param {string} namespace - Optional namespace (collection name)
     * @param {Object} filter - Optional filter for metadata
     * @returns {Promise<Object>} Object containing results and latency information
     */
    async queryVectors(queryText, topK = 5, namespace = null, filter = null) {
        try {
            const collectionName = namespace || this.collectionName;
            
            // Measure embedding generation time
            const embeddingStart = process.hrtime.bigint();
            const queryEmbedding = await this.generateEmbeddings(queryText);
            const embeddingEnd = process.hrtime.bigint();
            const embeddingLatency = Number(embeddingEnd - embeddingStart) / 1_000_000; // Convert to milliseconds

            // Measure Qdrant DB query time
            const dbQueryStart = process.hrtime.bigint();
            const searchResult = await this.client.search(collectionName, {
                vector: queryEmbedding,
                limit: topK,
                filter: filter || undefined,
                with_payload: true,
                with_vector: false,
            });
            const dbQueryEnd = process.hrtime.bigint();
            const dbQueryLatency = Number(dbQueryEnd - dbQueryStart) / 1_000_000; // Convert to milliseconds

            // Format results - searchResult is an array of results
            const results = (Array.isArray(searchResult) ? searchResult : []).map((result) => ({
                text: result.payload?.text || '',
                score: result.score,
                id: result.id,
                metadata: {
                    ...result.payload,
                    text: undefined, // Remove text from metadata to avoid duplication
                },
            }));

            const totalDbLatency = embeddingLatency + dbQueryLatency;

            // Console log the latencies
            console.log(`[Qdrant Query Latency] Collection: ${collectionName}`);
            console.log(`  - Embedding generation: ${embeddingLatency.toFixed(2)} ms`);
            console.log(`  - DB query: ${dbQueryLatency.toFixed(2)} ms`);
            console.log(`  - Total DB latency: ${totalDbLatency.toFixed(2)} ms`);

            return {
                results,
                latency: {
                    embedding_ms: parseFloat(embeddingLatency.toFixed(2)),
                    db_query_ms: parseFloat(dbQueryLatency.toFixed(2)),
                    total_db_ms: parseFloat(totalDbLatency.toFixed(2)),
                },
            };
        } catch (error) {
            console.error('Error querying Qdrant:', error);
            throw error;
        }
    }

    /**
     * Generate unique ID for points
     * Qdrant requires IDs to be either unsigned integers or UUIDs
     */
    generateUniqueId() {
        return randomUUID();
    }

    /**
     * Delete points by filter (optional)
     */
    async deletePoints(namespace = null, filter = null) {
        try {
            const collectionName = namespace || this.collectionName;
            await this.client.delete(collectionName, {
                wait: true,
                filter: filter || undefined,
            });
        } catch (error) {
            console.error('Error deleting points from Qdrant:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new QdrantService();

