import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config(); // Load API key from .env file

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY, // Set your Pinecone API key
});

export default pinecone;
