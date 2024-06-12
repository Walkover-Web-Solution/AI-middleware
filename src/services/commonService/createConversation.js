class conversationService {
  static createOpenAIConversation = conversation => {
    try {
      let threads = [];
      conversation.forEach(messages => {
        if (messages.role !== "tools_call" && messages.role !== "tool") {
          threads.push({role: messages.role, content: messages.content});
        }
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