import OpenAIInitializer from "./openaiInitializerService.js";
const runModel = async (configuration, chat = true, apiKey) => {
  try {
    console.log(configuration);
    const OpenAIConfig = new OpenAIInitializer(apiKey);
    const openAI = OpenAIConfig.getOpenAIService();
    let response;
    if (chat) {
      response = await openAI.chat.completions.create({
        ...configuration
      });
      return {
        success: true,
        response: response
      };
    }
    response = await openAI.completions.create({
      ...configuration
    });
    return {
      success: true,
      response: response
    };
  } catch (error) {
    console.log("runmodel error=>", error);
    return {
      success: false,
      error: error.message
    };
  }
};
const createEmbeddings = async (configuration, apiKey) => {
  try {
    console.log(configuration);
    const OpenAIConfig = new OpenAIInitializer(apiKey);
    const openAI = OpenAIConfig.getOpenAIService();
    const response = await openAI.embeddings.create({
      ...configuration
    });
    return {
      success: true,
      response: response
    };
  } catch (error) {
    console.log("runmodel error=>", error);
    return {
      success: false,
      error: error.message
    };
  }
};
export {
  runModel,
  createEmbeddings
};