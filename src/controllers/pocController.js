
import embeddings from '../services/langchainOpenai.js';
import { queryPinecone } from '../db_services/pineconeDbservice.js';
import rag_parent_data from '../db_services/rag_parent_data.js';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import qdrantService from '../services/qdrantService.js';
import { DocumentLoader } from '../services/document-loader/index.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';
import mammoth from 'mammoth';

export const openai = async (req, res, next) => {
    const body = {
        "model": "gpt-4o",
        "input": [
            {
                "role": "developer",
                "content": "Role: Similar Template Finder\n\nObjective: Search for specific Viasocket templates relevant to user needs, and return the matching Viasocket template efficiently from (https://viasocket.com/automations).\nInstructions:\n1. Identify the user's requirements for a template.\n2. Search targeting Viasocket templates that closely match these requirements.\n3. Analyze and categorize the most relevant templates found.\n4. Present clear reasoning for the recommended template(s) before conclusions.\n5. Return only one Viasocket template name and URL as the final output.\n6. Ensure all steps are concise (under 30 words) and maintain user context and structure.\n7. Verify the template before response; if no template is found, explicitly state \"no template present\". \n if you need current time in any case (otherwise ignore) - 2025-11-04 13:55:00 Tuesday (Asia/Kolkata)"
            },
            {
                "role": "user",
                "content": "send email after every five form submissions"
            }
        ],
        "tools": [
            {
                "type": "web_search_preview"
            }
        ]
    }
    const header = {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    }
    const response = await axios.post('https://api.openai.com/v1/responses', body, { headers: header })
    res.locals = { response: response?.data }
    req.statusCode = 200;
    return next();
};


export const pinecone = async (req, res, next) => {
    // TO DO: implement get_vectors_and_text logic
    const doc_id = "6874ac46f9c5b89acd2dafdb"
    const query = "Marketing Strategies"
    const top_k = 3
    const org_id = "7114";
    if (!query) throw new Error("Query is required.");
    // Generate embedding

    const start = process.hrtime.bigint();
    const embedding = await embeddings.embedQuery(query);
    const embedTime = process.hrtime.bigint() - start;
    // Query Pinecone (using service)
    const start2 = process.hrtime.bigint();
    const queryResponseIds = await queryPinecone(embedding, org_id, doc_id, top_k);
    const queryTime = process.hrtime.bigint() - start2;
    console.log(`Embedding took ${Number(embedTime) / 1_000_000} ms`);
    console.log(`Query took ${Number(queryTime) / 1_000_000} ms`);


    // Query MongoDB using retrieved chunk IDs
    const mongoResults = await rag_parent_data.getChunksByIds(queryResponseIds)
    let text = mongoResults.map((result) => result.data).join("");

    res.locals = { text }
    req.statusCode = 200;
    return next();
};

export const usopenai = async (req, res, next) => {
    const proxyUrl = 'http://us-proxy.viasocket.com:3128';

    // Create an agent that will tunnel HTTPS through the HTTP proxy
    const agent = new HttpsProxyAgent(proxyUrl);
    const body = {
        "model": "gpt-4o",
        "input": [
            {
                "role": "developer",
                "content": "Role: Similar Template Finder\n\nObjective: Search for specific Viasocket templates relevant to user needs, and return the matching Viasocket template efficiently from (https://viasocket.com/automations).\nInstructions:\n1. Identify the user's requirements for a template.\n2. Search targeting Viasocket templates that closely match these requirements.\n3. Analyze and categorize the most relevant templates found.\n4. Present clear reasoning for the recommended template(s) before conclusions.\n5. Return only one Viasocket template name and URL as the final output.\n6. Ensure all steps are concise (under 30 words) and maintain user context and structure.\n7. Verify the template before response; if no template is found, explicitly state \"no template present\". \n if you need current time in any case (otherwise ignore) - 2025-11-04 13:55:00 Tuesday (Asia/Kolkata)"
            },
            {
                "role": "user",
                "content": "send email after every five form submissions"
            }
        ],
        "tools": [
            {
                "type": "web_search_preview"
            }
        ]
    }
    const header = {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        'User-Agent': 'axios-squid-client/1.0',
        'Accept': 'application/json'
    }
    const response = await axios.post(
        "https://api.openai.com/v1/responses",
        body, // empty body
        {
            // IMPORTANT: tell axios not to try its built-in proxy handling
            proxy: false,
            // Use agent created above to route via Squid
            httpsAgent: agent,
            // optional timeout
            timeout: 10000,
            // optional headers
            headers: header
        }
    );

    res.locals = { response: response?.data }
    req.statusCode = 200;
    return next();
};

export const uspinecone = async (req, res, next) => {
    // TO DO: implement get_vectors_and_text logic
     const doc_id = "6874ac46f9c5b89acd2dafdb"
    const query = "Marketing Strategies"
    const top_k = 3
    const org_id = "7114";
    if (!query) throw new Error("Query is required.");
    // Generate embedding
    // Generate embedding

    const start = process.hrtime.bigint();
    const embedding = await embeddings.embedQuery(query);
    const embedTime = process.hrtime.bigint() - start;
    // Query Pinecone (using service)
    const start2 = process.hrtime.bigint();
    const queryResponseIds = await queryPinecone(embedding, org_id, doc_id, top_k);
    const queryTime = process.hrtime.bigint() - start2;
    console.log(`Embedding took ${Number(embedTime) / 1_000_000} ms`);
    console.log(`Query took ${Number(queryTime) / 1_000_000} ms`);


    // Query MongoDB using retrieved chunk IDs
    const mongoResults = await rag_parent_data.getChunksByIds(queryResponseIds)
    let text = mongoResults.map((result) => result.data).join("");

    res.locals = { text }
    req.statusCode = 200;
    return next();
};

/**
 * Extract text content from PDF or DOCX file
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} Extracted text content
 */
const extractTextFromFile = async (file) => {
    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error('Only PDF and DOCX files are supported.');
    }

    let textContent = '';

    // Extract text from PDF or DOCX
    if (file.mimetype === 'application/pdf') {
        // Handle PDF
        const pdfBlob = new Blob([file.buffer], { type: 'application/pdf' });
        const loader = new WebPDFLoader(pdfBlob, {});
        const docs = await loader.load();
        textContent = docs.map((doc) => doc.pageContent).join('\n\n');
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle DOCX
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        textContent = result.value;
    }

    if (!textContent || textContent.trim().length === 0) {
        throw new Error('Could not extract text from the file. Please ensure the file contains readable text.');
    }

    return textContent;
};

/**
 * Save PDF or DOCX file to Qdrant DB
 * Steps: Extract text -> Chunk -> Generate embeddings -> Save to Qdrant
 */
export const saveToQdrant = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new Error('File is required. Please upload a PDF or DOCX file.');
        }

        const file = req.file;
        const namespace = req.body.namespace || null; // Optional namespace
        const chunkSize = parseInt(req.body.chunkSize) || 512;
        const chunkOverlap = parseInt(req.body.chunkOverlap) || 50;

        // Extract text from file
        const textContent = await extractTextFromFile(file);

        // Chunk the text
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: chunkSize,
            chunkOverlap: chunkOverlap,
        });

        const chunks = await textSplitter.splitDocuments([
            { pageContent: textContent, metadata: {} }
        ]);

        const chunkTexts = chunks.map((chunk) => chunk.pageContent.trim()).filter((text) => text.length > 0);

        if (chunkTexts.length === 0) {
            throw new Error('No valid chunks created from the document.');
        }

        // Prepare metadata
        const metadata = {
            filename: file.originalname,
            mimetype: file.mimetype,
            file_size: file.size,
            uploaded_at: new Date().toISOString(),
        };

        // Save to Qdrant (this will chunk, embed, and save)
        const pointIds = await qdrantService.saveVectors(chunkTexts, namespace, metadata);

        res.locals = {
            success: true,
            message: 'File processed and saved to Qdrant successfully',
            data: {
                filename: file.originalname,
                chunks_created: chunkTexts.length,
                point_ids: pointIds,
                namespace: namespace || 'default',
            },
        };
        req.statusCode = 200;
        return next();
    } catch (error) {
        console.error('Error saving file to Qdrant:', error);
        throw error;
    }
};

/**
 * Query Qdrant DB for relevant data
 * Takes a message and optional namespace, returns top K results
 */
export const queryQdrant = async (req, res, next) => {
    try {
        const { message, namespace, topK } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            throw new Error('Message is required and must be a non-empty string.');
        }

        const k = parseInt(topK) || 5;
        const collectionName = namespace || null;

        // Measure total API latency
        const apiStart = process.hrtime.bigint();

        // Query Qdrant
        const queryResponse = await qdrantService.queryVectors(message.trim(), k, collectionName);

        const apiEnd = process.hrtime.bigint();
        const totalApiLatency = Number(apiEnd - apiStart) / 1_000_000; // Convert to milliseconds

        // Console log total API latency
        console.log(`[Qdrant Query API] Total API latency: ${totalApiLatency.toFixed(2)} ms`);

        res.locals = {
            success: true,
            message: 'Query executed successfully',
            data: {
                query: message,
                namespace: collectionName || 'default',
                top_k: k,
                results_count: queryResponse.results.length,
                results: queryResponse.results,
                latency: {
                    ...queryResponse.latency,
                    total_api_ms: parseFloat(totalApiLatency.toFixed(2)),
                },
            },
        };
        req.statusCode = 200;
        return next();
    } catch (error) {
        console.error('Error querying Qdrant:', error);
        throw error;
    }
};
