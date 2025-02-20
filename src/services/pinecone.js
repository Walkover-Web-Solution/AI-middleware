import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_APIKEY
});

const pineconeIndex = pinecone.Index("gtwyai"); 


export default pineconeIndex;
