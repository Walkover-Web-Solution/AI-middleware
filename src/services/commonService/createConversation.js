class conversationService {
  static createOpenAIConversation = conversation => {
    try {
      let threads = [];
      conversation.forEach(messages => {
        let chat = {};
        if (messages.role == "tool_calls") {
          chat = {
            role: "assistant",
            content: null,
            tool_calls: messages.function
          };
        } else if (messages.role == "tool") {
          chat = JSON.parse(messages.content);
        } else {
          chat["role"] = messages.role;
          chat["content"] = messages.content;
        }
        threads.push(chat);
      });
      return {
        success: true,
        messages: threads
      };
    } catch (error) {
      console.error("create conversation error=>", error);
      return {
        success: false,
        error: error.message,
        messages: []
      };
    }
  };
  static createGeminiConversation = conversation => {
    try {
      let threads = [];
      let previousRole = "model";
      conversation.forEach(messages => {
        let chat = {};
        const role = messages.role;
        chat["role"] = role;
        chat["parts"] = messages.content;
        if (previousRole != role) {
          threads.push(chat);
        }
        previousRole = role;
      });
      if (previousRole === "user") {
        threads.push({
          role: "model",
          parts: ""
        });
      }
      return {
        success: true,
        messages: threads
      };
    } catch (error) {
      console.error("create conversation error=>", error);
      return {
        success: false,
        error: error.message,
        messages: []
      };
    }
  };
}
export default conversationService;