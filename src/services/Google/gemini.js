// node --version # Should be >= 18
// npm install @google/generative-ai
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");

  async function runChat(configuration,api_key,service) {

    try {
        console.log("running gemini",configuration,api_key);
        const genAI = new GoogleGenerativeAI(api_key);
        const model = genAI.getGenerativeModel({ model: configuration?.model });
        console.log(model);
        delete configuration?.generationConfig?.model;
        configuration.safetySettings = [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ];
          console.log(configuration);
          switch (service) {
            case "chat":
              const chat = model.startChat({generationConfig: configuration?.generationConfig,history: configuration?.history, safetySettings: configuration?.safetySettings});
              const result = await chat.sendMessage(configuration?.user_input);
              const response = result.response;
              console.log(response.text());
              return {success:true,modelResponse:response}
            case "completion":
              const promptResponse=await model.generateContent(configuration?.prompt);
              return {success:true,modelResponse:promptResponse.response}

            case "embedding":
              const embeddingResponse = await model.embedContent(configuration?.input || "");
              return {success:true,modelResponse:embeddingResponse.embedding}
            
          }
          return {success:false,error:"operation undefined!"}
    } catch (error) {
        console.log("gemini error=>", error);
        return {success:false,error:error.message}
    }
}
module.exports={runChat}
   
  
//     const generationConfig = {
//       temperature: 0.9,
//       topK: 1,
//       topP: 1,
//       maxOutputTokens: 2048,
//     };
  
    
  
//     const chat = model.startChat({
//       generationConfig,
//       safetySettings,
//       history: [
//         {
//           role: "user",
//           parts: [{ text: "hello"}],
//         },
//         {
//           role: "model",
//           parts: [{ text: "Hello there! How can I assist you today?"}],
//         },
//         {
//           role: "user",
//           parts: [{ text: "How are u"}],
//         },
//         {
//           role: "model",
//           parts: [{ text: "I am well, thank you for asking. I am a large language model, designed to provide information and assist with a wide variety of inquiries and tasks. How are you doing today?"}],
//         },
//       ],
//     });
  
//     const result = await chat.sendMessage("YOUR_USER_INPUT");
//     const response = result.response;
//     console.log(response.text());
//   }
  
//   runChat();


