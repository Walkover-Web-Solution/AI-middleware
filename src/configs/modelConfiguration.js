class ModelsConfig {
  //params:[vlaue,enum(0,1,2) 0->optional, 1->required, 2->optional with default value]
  static gpt_3_5_turbo = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-3.5-turbo",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.0005,
          output_cost: 0.0015
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_3_5_turbo_0613 = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-3.5-turbo-0613",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.0005,
          output_cost: 0.0015
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_3_5_turbo_0125 = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-3.5-turbo-0125",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      },
      "tools": {
        field: "array",
        level: 0,
        default: []
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0
      },
      "response_format": {
        field: "boolean",
        default: {
          type: "text"
        },
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.0005,
          output_cost: 0.0015
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_3_5_turbo_0301 = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-3.5-turbo-0301",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      },
      "tools": {
        field: "array",
        level: 0,
        default: []
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0
      },
      "response_format": {
        field: "boolean",
        default: {
          type: "text"
        },
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens"
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_3_5_turbo_1106 = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-3.5-turbo-1106",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      },
      "tools": {
        field: "array",
        level: 0,
        default: []
      },
      "tool_choice": {
        field: "string",
        default: "auto",
        level: 0
      },
      "response_format": {
        field: "boolean",
        default: {
          type: "text"
        },
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.0005,
          output_cost: 0.0015
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_3_5_turbo_16k = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-3.5-turbo-16k",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      },
      "tools": {
        field: "array",
        level: 0,
        default: []
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0
      },
      "response_format": {
        field: "boolean",
        default: {
          type: "text"
        },
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens"
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_3_5_turbo_16k_0613 = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-3.5-turbo-16k-0613",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      },
      "tools": {
        field: "array",
        level: 0,
        default: []
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0
      },
      "response_format": {
        field: "boolean",
        default: {
          type: "text"
        },
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens"
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_4 = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-4",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      },
      "tools": {
        field: "array",
        level: 0,
        default: []
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.03,
          output_cost: 0.06
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_4_0613 = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-4-0613",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      },
      "tools": {
        field: "array",
        level: 0,
        default: []
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.03,
          output_cost: 0.06
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_4_1106_preview = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-4-1106-preview",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      },
      "tools": {
        field: "array",
        level: 0,
        default: []
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0
      },
      "response_format": {
        field: "boolean",
        default: {
          type: "text"
        },
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.01,
          output_cost: 0.03
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_4_turbo_preview = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-4-turbo-preview",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      },
      "tools": {
        field: "array",
        level: 0,
        default: []
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0
      },
      "response_format": {
        field: "boolean",
        default: {
          type: "text"
        },
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.01,
          output_cost: 0.03
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_4_0125_preview = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "gpt-4-0125-preview",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      },
      "tools": {
        field: "array",
        level: 0,
        default: []
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0
      },
      "response_format": {
        field: "boolean",
        default: {
          type: "text"
        },
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.01,
          output_cost: 0.03
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_4_turbo_2024_04_09 = () => {
    const configuration = {
      "model": {
        field: "drop",
        default: "gpt-4-turbo-2024-04-09",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean"
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean"
      },
      "tools": {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array"
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string"
      },
      "response_format": {
        field: "boolean",
        default: {
          type: "text"
        },
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.01,
          output_cost: 0.03
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "default": {
          "role": "system",
          "content": ""
        },
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      inputConfig,
      outputConfig
    };
  };
  static gpt_4_turbo = () => {
    const configuration = {
      "model": {
        field: "drop",
        default: "gpt-4-turbo",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean"
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean"
      },
      "tools": {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array"
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string"
      },
      "response_format": {
        field: "boolean",
        default: {
          type: "text"
        },
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.01,
          output_cost: 0.03
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "role": "system",
        "content": "",
        "contentKey": "content",
        "type": "json"
      }
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_4o = () => {
    const configuration = {
      "model": {
        field: "drop",
        default: "gpt-4-turbo",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean"
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean"
      },
      "tools": {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array"
      },
      "tool_choice": {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string"
      },
      "response_format": {
        field: "boolean",
        default: {
          type: "text"
        },
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.01,
          output_cost: 0.03
        }
      }],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id"
    };
    const inputConfig = {
      system: {
        "role": "system",
        "content": "",
        "contentKey": "content",
        "type": "json"
      },
      content_location: "prompt[0].content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static text_embedding_3_large = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "text-embedding-3-large",
        "level": 1
      },
      "encoding_format": {
        field: "dropdown",
        typeOf: "string",
        level: 2
      },
      "dimensions": {
        field: "number",
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: 0.00013
      }],
      message: "data[0].embedding"
    };
    const inputConfig = {
      input: {
        "input": "",
        "contentKey": "input",
        "type": "text"
      },
      content_location: "input"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static text_embedding_3_small = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "text-embedding-3-large",
        "level": 1
      },
      "encoding_format": {
        field: "dropdown",
        values: ['float', 'base64'],
        default: "float",
        level: 2
      },
      "dimensions": {
        field: "number",
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: 0.00002
      }],
      message: "data[0].embedding"
    };
    const inputConfig = {
      input: {
        "input": "",
        "contentKey": "input",
        "type": "text"
      },
      content_location: "input"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static text_embedding_ada_002 = () => {
    const configuration = {
      "model": {
        field: "dropdown",
        default: "text-embedding-3-large",
        "level": 1
      },
      "encoding_format": {
        field: "dropdown",
        values: ['float', 'base64'],
        default: "float",
        level: 2
      }
      // dimensions is fixed here, 1536 will be the size of the vector
    };

    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        total_tokens: "usage.total_tokens"
      }],
      message: "data[0].embedding"
    };
    const inputConfig = {
      input: {
        "input": "",
        "contentKey": "input",
        "type": "text"
      },
      content_location: "input"
    };
    return {
      configuration,
      outputConfig,
      inputConfig
    };
  };
  static gpt_3_5_turbo_instruct = () => {
    const configuration = {
      "model": {
        field: "drop",
        default: "gpt-3.5-turbo-instruct",
        "level": 1
      },
      "best_of": {
        field: "slider",
        min: 1,
        max: 20,
        default: 1,
        level: 2,
        step: 1
      },
      "echo": {
        field: "text",
        default: false,
        typeOf: "boolean",
        level: 2
      },
      "frequency_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      //"logit_bias": { field: "text", typeOf: "json_object", default: null, level: 0 },
      "logprobs": {
        field: "boolean",
        default: false,
        level: 0
      },
      "max_tokens": {
        field: "slider",
        min: 0,
        max: 1024,
        step: 1,
        default: 256,
        level: 2
      },
      "n": {
        field: "number",
        default: 1,
        level: 0
      },
      "presence_penalty": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2
      },
      "seed": {
        field: "number",
        default: 0,
        level: 0
      },
      "stop": {
        field: "text",
        default: "",
        level: 0
      },
      "stream": {
        field: "boolean",
        default: false,
        level: 0
      },
      "suffix": {
        field: "text",
        default: "",
        level: 2
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2
      },
      "top_p": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.prompt_tokens",
        completion_tokens: "usage.completion_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: {
          input_cost: 0.0015,
          output_cost: 0.0020
        }
      }],
      message: "choices[0].text",
      assistant: "choices",
      id: "id"
    };
    const inputConfig = {
      prompt: {
        "prompt": "",
        "contentKey": "prompt",
        "type": "text"
      },
      content_location: "prompt"
    };
    const chatmessage = {
      chat: {
        role: "user",
        content: ""
      },
      chatpath: "content"
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
      chatmessage
    };
  };
  static gemini_pro = () => {
    const configuration = {
      "model": {
        field: "drop",
        default: "gemini-pro",
        "level": 1
      },
      "temperature": {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
        level: 2
      },
      "topK": {
        field: "slider",
        min: 1,
        max: 40,
        step: 1,
        default: 40,
        level: 2
      },
      "topP": {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2
      },
      "maxOutputTokens": {
        field: "slider",
        min: 1,
        max: 30720,
        step: 1,
        default: 2048,
        level: 0
      },
      "stopSequences": {
        field: "text",
        default: "",
        level: 0
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.input_tokens",
        output_tokens: "usage.output_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: 0
      }],
      message: "candidates[0].content.parts[0].text",
      role: "model"
    };
    return {
      configuration,
      outputConfig
    };
  };
  static embedding_001 = () => {
    const configuration = {
      "model": {
        field: "drop",
        default: "embedding-001",
        "level": 1
      }
    };
    const outputConfig = {
      usage: [{
        prompt_tokens: "usage.input_tokens",
        output_tokens: "usage.output_tokens",
        total_tokens: "usage.total_tokens",
        total_cost: 0
      }],
      message: "values",
      role: "model"
    };
    return {
      configuration,
      outputConfig
    };
  };
}
export default ModelsConfig;