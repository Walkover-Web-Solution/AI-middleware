import axios from 'axios';
import { Readable } from 'stream';
import csvParser from 'csv-parser';


export function getFileFormatByUrl(url) {
    const formats = [
        { regex: /docs\.google\.com\/document\/d\//, format: 'txt' },
        { regex: /docs\.google\.com\/spreadsheets\/d\//, format: 'csv' },
        { regex: /docs\.google\.com\/presentation\/d\//, format: 'pdf' },
        { regex: /onedrive\.live\.com\/.*\.docx/, format: 'txt' },
        { regex: /onedrive\.live\.com\/.*\.xlsx/, format: 'csv' },
        { regex: /onedrive\.live\.com\/.*\.pptx/, format: 'pdf' },
        { regex: /sharepoint\.com\/.*\.docx/, format: 'txt' },
        { regex: /sharepoint\.com\/.*\.xlsx/, format: 'csv' },
        { regex: /sharepoint\.com\/.*\.pptx/, format: 'pdf' }
    ];
    
    const match = formats.find(({ regex }) => regex.test(url));
    return match ? match.format : 'unknown';
}


export async function fetchAndProcessCSV(url) {
    const response = await axios.get(url, { responseType: 'stream' });
    const rows = [];
    let headersCaptured = false;
    let headers = [];

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

    const descriptiveSentence = await axios.post("https://api.gtwy.ai/api/v2/model/chat/completion", {
        user: string, 
        bridge_id : "67bc58cbd94d505d999ae1f4"
    }, {
        headers: {pauthkey : process.env.PAUTHKEY}
    }).then(res => JSON.parse(res.data.response.data.content).descriptiveSentence)
    .catch(err => console.error(err));
   
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
    return descriptiveRows;

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