import axios from 'axios';

export class ScriptLoader {
    async getContent(url, options) {
        const response = await axios.get(url, options);
        if(!response.data || typeof response.data !== 'object') {
            throw new Error('Invalid response format');
        }
        return options?.fileId ? response.data[options.fileId] : response.data;
    }
}