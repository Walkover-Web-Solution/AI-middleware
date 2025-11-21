
import embeddings from '../services/langchainOpenai.js';
import { queryPinecone } from '../db_services/pineconeDbservice.js';
import rag_parent_data from '../db_services/rag_parent_data.js';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

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
