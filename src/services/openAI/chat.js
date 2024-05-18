import { runModel } from "./runModel.js";

const chats = async (configuration, apikey) => {
  try {
    // console.log(configuration, apikey);
    const {
      success,
      response,
      error
    } = await runModel(configuration, true, apikey);
    if (!success) {
      return {
        success: false,
        error: error
      };
    }
    return {
      success: true,
      modelResponse: response
    };
  } catch (error) {
    console.log("chats error=>", error);
    return {
      success: false,
      error: error.message
    };
  }
};
export {
  chats
};