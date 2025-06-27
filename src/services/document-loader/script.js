import axios from 'axios';

export class ScriptLoader {
    async getContent(url, options) {
        const response = await axios.get(url, options);
        return options?.fileId ? response.data[options.fileId] : response.data;
    }
}