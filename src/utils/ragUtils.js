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


export async function fetchCSV(url) {
    const response = await axios.get(url, { responseType: 'stream' });
    const rows = [];

    return new Promise((resolve, reject) => {
        response.data
            .pipe(csvParser({ headers: false })) // No headers, treat all rows as raw arrays
            .on('data', (row) => rows.push(Object.values(row).join(','))) // Convert row to CSV string
            .on('end', () => resolve(rows))
            .on('error', reject);
    });
}