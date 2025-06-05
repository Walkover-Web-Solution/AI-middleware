import axios from 'axios';

export class ScriptLoader {
    async getContent(url, options) {
        const response = await axios.get(url, options);
        return response.data.map(file => file.fileContent);
    }
}