import pineconeIndex from "../services/pinecone.js";


export const queryPinecone = async (embedding, org_id, doc_id, top_k = 2) => {
  try {
    const queryResponse = await pineconeIndex.query({
      vector: embedding,
      namespace: org_id,
      filter: { doc_id: Array.isArray(doc_id) ? { $in: doc_id } : doc_id, org_id },
      topK: top_k,
    });

    return queryResponse.matches.map((result) => result.id);
  } catch (error) {
    console.error("Error querying Pinecone:", error);
    throw new Error("Error querying Pinecone.");
  }
};