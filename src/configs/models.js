const services = {
  openai: {
    models: new Set(["gpt-3.5-turbo", "gpt-3.5-turbo-0613", "gpt-3.5-turbo-0125", "gpt-3.5-turbo-1106", "gpt-4", "gpt-4o","gpt-4o-mini", "gpt-4-turbo", "gpt-4-0613", "gpt-4-1106-preview", "gpt-4-turbo-preview", "gpt-4-0125-preview", "gpt-4-turbo-2024-04-09", "text-embedding-3-large", "text-embedding-3-small", "text-embedding-ada-002", "gpt-3.5-turbo-instruct"]),
    completion: new Set(["gpt-3.5-turbo-instruct"]),
    chat: new Set(["gpt-3.5-turbo", "gpt-3.5-turbo-0613", "gpt-3.5-turbo-0125", "gpt-3.5-turbo-1106", "gpt-4", "gpt-4o","gpt-4o-mini", "gpt-4-turbo", "gpt-4-0613", "gpt-4-1106-preview", "gpt-4-turbo-preview", "gpt-4-0125-preview", "gpt-4-turbo-2024-04-09"]),
    embedding: new Set(["text-embedding-3-large", "text-embedding-3-small", "text-embedding-ada-002"])
  },
  google: {
    models: new Set(["gemini-pro","gemini-1.5-pro","gemini-1.0-pro-vision","gemini-1.0-pro","gemini-1.5-Flash"]),
    chat: new Set(["gemini-pro","gemini-1.5-pro","gemini-1.0-pro-vision","gemini-1.0-pro","gemini-1.5-Flash"]),
    completion: new Set(["gemini-pro","gemini-1.5-pro","gemini-1.0-pro-vision","gemini-1.0-pro","gemini-1.5-Flash"]),
    embedding: new Set(["embedding-001"])
  },
  anthropic : {
    models:new Set (["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"]),
     chat: new Set(["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"]),
  },
  groq : {
      models:new Set (["llama-3.1-405b-reasoning", "llama-3.1-70b-versatile", "llama-3.1-8b-instant", "llama3-groq-70b-8192-tool-use-preview","llama3-groq-8b-8192-tool-use-preview","llama3-70b-8192","llama3-8b-8192","mixtral-8x7b-32768","gemma-7b-it","gemma2-9b-it","whisper-large-v3"]),
      chat: new Set(["llama-3.1-405b-reasoning", "llama-3.1-70b-versatile", "llama-3.1-8b-instant", "llama3-groq-70b-8192-tool-use-preview","llama3-groq-8b-8192-tool-use-preview","llama3-70b-8192","llama3-8b-8192","mixtral-8x7b-32768","gemma-7b-it","gemma2-9b-it","whisper-large-v3"])
  }
};
const messageRoles = {
  chat: ["system", "user"],
  completion: ["prompt"],
  embedding: ["input"]
};
export {
  services,
  messageRoles
};