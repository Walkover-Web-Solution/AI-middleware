

async function callOpenAIModelsApi(apiKey) {
    const url = 'https://api.openai.com/v1/models';
    const headers = {
      'Authorization': `Bearer ${apiKey}`
    };

    try {
      const response = await fetch(url, { method: 'GET', headers });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
}

async function callAnthropicApi(apiKey) {
    const url = 'https://api.anthropic.com/v1/messages';
    const headers = {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    };

    const body = JSON.stringify({
      model: "claude-3-5-sonnet",
      messages: [
        { role: "user", content: "Hello, world" }
      ]
    });

    try {
      const response = await fetch(url, { method: 'POST', headers, body });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
}

async function callGroqApi(apiKey) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const body = JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        { role: "user", content: "hii" }
      ]
    });

    try {
      const response = await fetch(url, { method: 'POST', headers, body });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
}

  export {
    callOpenAIModelsApi,
    callAnthropicApi,
    callGroqApi
  }