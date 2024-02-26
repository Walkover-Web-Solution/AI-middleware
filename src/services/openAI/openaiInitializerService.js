const { OpenAI } = require("openai");


class OpenAIInitializer {
constructor(apiKey) {
    this.openai = new OpenAI({
        apiKey: apiKey
    });
}

    getOpenAIService=()=>{
        return this.openai
    }
}


module.exports=OpenAIInitializer
