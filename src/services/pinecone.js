import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import { OpenAIEmbeddings } from "@langchain/openai";
import RagDataService from "./ragDataService.js";

dotenv.config();

const MAX_REQUEST_SIZE = 4 * 1024 * 1024;

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  batchSize: 100,
  model: 'text-embedding-3-small',
});


const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX); 


export const savingVectorsInPineconeBatches = async (vectors, namespace) => {
  try {
      let currentBatch = [];
      let currentBatchSize = 0;

      for (const vector of vectors) {
          const vectorSize = calculateVectorSize(vector);

          if (currentBatchSize + vectorSize > MAX_REQUEST_SIZE) {
              await pineconeIndex.namespace(namespace).upsert(currentBatch);
              currentBatch = [];
              currentBatchSize = 0;
          }

          currentBatch.push(vector);
          currentBatchSize += vectorSize;
      }

      if (currentBatch.length > 0) await pineconeIndex.namespace(namespace).upsert(currentBatch);
  } catch (error) {
      console.error("Error saving vectors to Pinecone:", error);
      throw error;
  }
};

export const deleteResourceChunks = async (namespace, resourceId) => {
  const resourceChunks = await RagDataService.getChunksByResource(resourceId);
  const chunkIds = resourceChunks.map(chunk => chunk._id);
  if (chunkIds.length === 0) return;
  return pineconeIndex.namespace(namespace).deleteMany(chunkIds);
};

export const deleteVectorsFromPinecone = async (vectorIdsArray, namespace) => {
  try {
      await pineconeIndex.namespace(namespace).deleteMany(vectorIdsArray);
  } catch (error) {
      console.log(`vector Id is not available ${vectorIdsArray} for Namespace ${namespace}`, error);
  }
};

export const deleteNamespaceInPinecone = async (namespace) => {
  try {
      await pineconeIndex.namespace(namespace).deleteAll();
  } catch (error) {
      console.error(`Namespace ${namespace} does not exist in Pinecone`, error);
  }
};

export const saveVectorsToPinecone = async (docId, text, namespace) => {
  try {
      const textChunks = chunkTextWithOverlap(text, 512, 50);
      const textEmbeddings = await embeddings.embedDocuments(textChunks);
      const vectors = textEmbeddings.map((embedding, pineconeIndex) => ({
          id: Math.floor(10000000 + Math.random() * 90000000).toString(),
          values: embedding,
          metadata: { docId, text: textChunks[pineconeIndex] }
      }));
      const vectorIds = vectors.map(vector => vector.id);
      await savingVectorsInPineconeBatches(vectors, namespace);
      return vectorIds;
  } catch (error) {
      console.error("Error in saveVectorsToPinecone:", error);
      throw error;
  }
};

export const queryLangchain = async (prompt, agentId) => {
  try {
      console.log(Date.now(), "Embedding query");
      const queryEmbedding = await embeddings.embedQuery(prompt);
      console.log(Date.now(), "Querying Pinecone");
      const queryResponse = await pineconeIndex.namespace("default").query({
          topK: 4,
          includeMetadata: true,
          vector: queryEmbedding,
          filter: { agentId: { $eq: agentId } }
      });
      console.log(Date.now(), "Pinecone response received");
      const vectorIds = queryResponse.matches.map(match => match.id);
      const textChunks = await Promise.all(vectorIds.map(async id => (await RagDataService.getChunkById(id)).data));
      return textChunks.join(" ");
  } catch (error) {
      console.log(error);
      throw new Error("Invalid AI response");
  }
};

export const vectorSearch = async (query, agentId) => {
  console.log(Date.now(), "Embedding query");
  const queryEmbedding = await embeddings.embedQuery(query);
  console.log(Date.now(), "Querying Pinecone");
  const queryResponse = await pineconeIndex.namespace("default").query({
      topK: 4,
      includeMetadata: true,
      vector: queryEmbedding,
      filter: { agentId: { $eq: agentId } }
  });
  const vectorIds = queryResponse.matches.map(match => match.id);
  console.log(Date.now(), "Pinecone response received");
  return vectorIds;
};

export const getVectorIdsFromSearchText = async (searchText, namespace = "default") => {
  const queryEmbedding = await embeddings.embedQuery(searchText);
  return pineconeIndex.namespace(namespace).query({ topK: 5, includeMetadata: true, vector: queryEmbedding });
};

// export const getCrawledDataFromSite = async (url) => {
//   try {
//       const docId = url?.match(/\/d\/(.*?)\//)?.[1];
//       const loader = new CheerioWebBaseLoader(`https://docs.google.com/document/d/${docId}/export?format=txt`);
//       const docs = await loader.load();
//       return docs[0].pageContent;
//   } catch (error) {
//       console.error('Error fetching the webpage:', error);
//       throw error;
//   }
// };

export const calculateVectorSize = (vector) => {
  const serializedVector = JSON.stringify(vector);
  return Buffer.byteLength(serializedVector, 'utf8');
};

export const chunkTextWithOverlap = (text, chunkSize, overlapSize) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += (chunkSize - overlapSize)) {
      const chunk = text.slice(i, i + chunkSize);
      chunks.push(chunk);
      if (i + chunkSize >= text.length) {
          break;
      }
  }
  return chunks;
};

export default pineconeIndex;
