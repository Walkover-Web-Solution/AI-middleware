import pineconeIndex from "../services/pinecone.service.js";


export const queryPinecone = async (embedding, org_id, doc_id, top_k) => {
  try {
    // const queryResponse = await pineconeIndex.query({
    //   vector: embedding,
    //   filter: { doc_id: Array.isArray(doc_id) ? { $in: doc_id } : doc_id },
    //   topK: top_k,
    // });

    const queryResponse = await pineconeIndex.namespace(org_id).query({
      topK: top_k, includeMetadata: true, vector: embedding,
       filter: { docId: Array.isArray(doc_id) ? { $in: doc_id } : doc_id }
  });
    return queryResponse.matches.map((result) => result.id);
  } catch (error) {
    console.error("Error querying Pinecone:", error);
    throw new Error("Error querying Pinecone.");
  }
};