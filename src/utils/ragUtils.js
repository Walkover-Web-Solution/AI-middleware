import axios from 'axios';
import csvParser from 'csv-parser';
import { sendAlert } from '../services/utils/utilityService.js';
import jwt from 'jsonwebtoken';

export function getFileFormatByUrl(url) {
    const formats = [
        { regex: /docs\.google\.com\/document\/d\//, format: 'txt' },
        { regex: /docs\.google\.com\/spreadsheets\/d\//, format: 'csv' },
        { regex: /docs\.google\.com\/presentation\/d\//, format: 'pdf' },
        // { regex: /onedrive\.live\.com\/.*\.docx/, format: 'txt' },
        // { regex: /onedrive\.live\.com\/.*\.xlsx/, format: 'csv' },
        // { regex: /onedrive\.live\.com\/.*\.pptx/, format: 'pdf' },
        // { regex: /sharepoint\.com\/.*\.docx/, format: 'txt' },
        // { regex: /sharepoint\.com\/.*\.xlsx/, format: 'csv' },
        // { regex: /sharepoint\.com\/.*\.pptx/, format: 'pdf' }, 
        { regex: /^https?:\/\/flow\.sokt\.io\/func\/[a-zA-Z0-9]+$/, format: 'script' },
        { regex: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/, format: 'txt' }, // Use 'url' instead of 'txt'
    ];
    
    const match = formats.find(({ regex }) => regex.test(url));
    if(!match){
        sendAlert('FILE FORMAT NOT SUPPORTED', {}, url)
    }
    return match ? match.format : 'unknown';
}


export async function fetchAndProcessCSV(url) {
    const response = await axios.get(url, { responseType: 'stream' });
    const rows = [];
    let headersCaptured = false;
    let headers = [];
    const result = {};

    const callBridge = async (bridge_id, user) => JSON.parse((await axios.post("https://api.gtwy.ai/api/v2/model/chat/completion", {bridge_id, user}, {
        headers: {pauthkey : process.env.PAUTHKEY}
    })).data.response.data.content);

    await new Promise((resolve, reject) => {
        response.data
            .pipe(csvParser())
            .on('data', (row) => {
                if (!headersCaptured) {
                    headers = Object.keys(row);
                    headersCaptured = true;
                }
                rows.push(row);
            })
            .on('end', () => resolve({ headers, rows }))
            .on('error', reject);
    });

    const string = headers.join(',') + "\n" + rows.slice(0, 5).map(row => Object.values(row).join(',')).join('\n');
    const chunkSuggestion = (await callBridge("67c2fbb8017a2cb2b26e99a2", string)).Suggestion;

    result.headers = headers;

    if(chunkSuggestion.includes('row')){
        const descriptiveSentence = (await callBridge("67bc58cbd94d505d999ae1f4", string)).descriptiveSentence;
    
        function replaceVariables(template, values) {
            return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
                key = key.trim(); // Trim spaces around the key
                return values.hasOwnProperty(key) ? values[key] : match; // Replace if key exists
            });
        }

        let descriptiveRows = [];
        for(let row of rows){
            const result = replaceVariables(descriptiveSentence, row);
            descriptiveRows.push(result);
            
        }
        result.rowWiseData = descriptiveRows;
    }

    if(chunkSuggestion.includes('column')){
        const columnWiseData = rows.reduce((acc, row) => {
            for(const key in row){
                if(!acc[key]) acc[key] = [];
                acc[key].push(row[key]);
            }
            return acc;
        }, {})

        result.columnWiseData = Object.entries(columnWiseData).map(([header, values]) => [header, ...values].join("\n"));
    }

    return result;
}


export async function getChunkingType(text) {
    try {
      const variables = {text : text};
  
      const response = await fetch("https://proxy.viasocket.com/proxy/api/1258584/29gjrmh24/api/v2/model/chat/completion", {
        method: "POST",
        headers: {
          "pauthkey": "1b13a7a038ce616635899a239771044c",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user: "suggest the best type of chuking.",
          bridge_id: "67bdb70c1201653d967e901a",
          variables: variables
        })
      });
  
      const Response = await response.json();
      const chunking_type = JSON.parse(Response.response?.data?.content).Suggestion;
      return chunking_type
    } catch (err) {
      console.error("Error Getting chunk type=>", err);
      throw err;
    }
  }

export function getScriptId(url){
    const regex = /flow\.sokt\.io\/func\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

export default async function getChunksByAi(text, chunk_size, chunk_overlap) {
    try {
        const variables = {text, chunk_size, chunk_overlap};
        const response = await fetch("https://proxy.viasocket.com/proxy/api/1258584/29gjrmh24/api/v2/model/chat/completion", {
        method: "POST",
        headers: {
            "pauthkey": "1b13a7a038ce616635899a239771044c",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user: "chunk the text",
            bridge_id: "67bdb9b41201653d967e901c",
            variables: variables
        })
        });

        const Response = await response.json();

        const chunks = JSON.parse(Response.response?.data?.content).chunks;
        return chunks
    } catch (err) {
        console.error("Error Getting chunks", err);
        throw err;
    }
}

export const genrateToken = async (orgId) => {
    const token = await jwt.sign({ org_id: process.env.RAG_EMBED_ORG_ID, "project_id": process.env.RAG_EMBED_PROJECT_ID, "user_id": orgId }, process.env.RAG_EMBED_SECRET_KEY);
    return token
}