class ModelsConfig {
  //params:[vlaue,enum(0,1,2) 0->optional, 1->required, 2->optional with default value]
  static gpt_3_5_turbo = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-3.5-turbo",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.0005,
            output_cost: 0.0015,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_3_5_turbo_0613 = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-3.5-turbo-0613",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.0005,
            output_cost: 0.0015,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_3_5_turbo_0125 = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-3.5-turbo-0125",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.0005,
            output_cost: 0.0015,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_3_5_turbo_0301 = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-3.5-turbo-0301",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_3_5_turbo_1106 = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-3.5-turbo-1106",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "string",
        default: "auto",
        level: 0,
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.0005,
            output_cost: 0.0015,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_3_5_turbo_16k = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-3.5-turbo-16k",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 16384,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_3_5_turbo_16k_0613 = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-3.5-turbo-16k-0613",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 16384,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_4 = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-4",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 8192,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.03,
            output_cost: 0.06,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_4_0613 = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-4-0613",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 8192,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.03,
            output_cost: 0.06,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_4_1106_preview = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-4-1106-preview",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_4_turbo_preview = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-4-turbo-preview",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_4_0125_preview = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-4-0125-preview",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_4_turbo_2024_04_09 = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "gpt-4-turbo-2024-04-09",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      inputConfig,
      outputConfig,
    };
  };
  static gpt_4_turbo = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "gpt-4-turbo",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_4o = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "gpt-4o",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
      vision: {
        support: true,
        level: 0,
        default: false,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };

  static o1_preview = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "o1-preview",
        level: 1,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };

  static o1_mini = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "o1-mini",
        level: 1,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };

  static chatgpt_4o_latest = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "chatgpt-4o-latest",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 16384,
        step: 1,
        default: 256,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      response_format: {
        field: "boolean",
        default: {
          type: "text",
        },
        level: 0,
      },
      vision: {
        support: true,
        level: 0,
        default: false,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };

  static gpt_4o_2024_08_06 = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "gpt-4o-2024-08-06",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration: configuration,
      outputConfig: outputConfig,
      inputConfig: inputConfig,
    };
  };

  static gpt_4o_mini = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-4o-mini",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 8192,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
      },
      type: {
        default: ["chat"],
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
      vision: {
        support: true,
        level: 0,
        default: false,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.03,
            output_cost: 0.06,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration: configuration,
      outputConfig: outputConfig,
      inputConfig: inputConfig,
    };
  };

  static gpt_4o_mini_2024_07_18 = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "gpt-4o-mini-2024-07-18",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 8192,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
      },
      type: {
        default: ["chat"],
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.03,
            output_cost: 0.06,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        default: {
          role: "system",
          content: "",
        },
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration: configuration,
      outputConfig: outputConfig,
      inputConfig: inputConfig,
    };
  };

  static text_embedding_3_large = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "text-embedding-3-large",
        level: 1,
      },
      encoding_format: {
        field: "dropdown",
        typeOf: "string",
        level: 2,
      },
      dimensions: {
        field: "number",
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: 0.00013,
        },
      ],
      message: "data[0].embedding",
    };
    const inputConfig = {
      input: {
        input: "",
        contentKey: "input",
        type: "text",
      },
      content_location: "input",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static text_embedding_3_small = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "text-embedding-3-large",
        level: 1,
      },
      encoding_format: {
        field: "dropdown",
        values: ["float", "base64"],
        default: "float",
        level: 2,
      },
      dimensions: {
        field: "number",
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: 0.00002,
        },
      ],
      message: "data[0].embedding",
    };
    const inputConfig = {
      input: {
        input: "",
        contentKey: "input",
        type: "text",
      },
      content_location: "input",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static text_embedding_ada_002 = () => {
    const configuration = {
      model: {
        field: "dropdown",
        default: "text-embedding-3-large",
        level: 1,
      },
      encoding_format: {
        field: "dropdown",
        values: ["float", "base64"],
        default: "float",
        level: 2,
      },
      // dimensions is fixed here, 1536 will be the size of the vector
    };

    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          total_tokens: "usage.total_tokens",
        },
      ],
      message: "data[0].embedding",
    };
    const inputConfig = {
      input: {
        input: "",
        contentKey: "input",
        type: "text",
      },
      content_location: "input",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static gpt_3_5_turbo_instruct = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "gpt-3.5-turbo-instruct",
        level: 1,
      },
      best_of: {
        field: "slider",
        min: 1,
        max: 20,
        default: 1,
        level: 2,
        step: 1,
      },
      echo: {
        field: "text",
        default: false,
        typeOf: "boolean",
        level: 2,
      },
      frequency_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      //"logit_bias": { field: "text", typeOf: "json_object", default: null, level: 0 },
      logprobs: {
        field: "boolean",
        default: false,
        level: 0,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      n: {
        field: "number",
        default: 1,
        level: 0,
      },
      presence_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      seed: {
        field: "number",
        default: 0,
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
      },
      suffix: {
        field: "text",
        default: "",
        level: 2,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.0015,
            output_cost: 0.002,
          },
        },
      ],
      message: "choices[0].text",
      assistant: "choices",
      id: "id",
    };
    const inputConfig = {
      prompt: {
        prompt: "",
        contentKey: "prompt",
        type: "text",
      },
      content_location: "prompt",
    };
    const chatmessage = {
      chat: {
        role: "user",
        content: "",
      },
      chatpath: "content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
      chatmessage,
    };
  };
  static gemini_1_5_pro = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "gemini-1.5-pro",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
        level: 2,
      },
      topK: {
        field: "slider",
        min: 1,
        max: 40,
        step: 1,
        default: 40,
        level: 2,
      },
      topP: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      maxOutputTokens: {
        field: "slider",
        min: 1,
        max: 8192,
        step: 1,
        default: 2048,
        level: 0,
      },
      stopSequences: {
        field: "text",
        default: "",
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.input_tokens",
          output_tokens: "usage.output_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: 0,
        },
      ],
      message: "candidates[0].content.parts[0].text",
      role: "model",
    };
    const inputConfig = {
      model: {
        default: {
          role: "model",
          parts: [
            {
              text: "",
            },
          ],
        },
        contentKey: "parts[0].text",
        type: "json",
      },
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };

  static embedding_001 = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "embedding-001",
        level: 1,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.input_tokens",
          output_tokens: "usage.output_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: 0,
        },
      ],
      message: "values",
      role: "model",
    };
    const inputConfig = {
      model: {
        default: {
          role: "model",
          parts: [
            {
              text: "",
            },
          ],
        },
        contentKey: "parts[0].text",
        type: "json",
      },
      content_location: "prompt",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };

  static gemini_pro = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "gemini-pro",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
        level: 2,
      },
      topK: {
        field: "slider",
        min: 1,
        max: 40,
        step: 1,
        default: 40,
        level: 2,
      },
      topP: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      maxOutputTokens: {
        field: "slider",
        min: 1,
        max: 30720,
        step: 1,
        default: 2048,
        level: 0,
      },
      stopSequences: {
        field: "text",
        default: "",
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.input_tokens",
          output_tokens: "usage.output_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: 0,
        },
      ],
      message: "candidates[0].content.parts[0].text",
      role: "model",
    };
    const inputConfig = {
      model: {
        default: {
          role: "model",
          parts: [
            {
              text: "",
            },
          ],
        },
        contentKey: "parts[0].text",
        type: "json",
      },
      content_location: "prompt",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };

  static gemini_1_5_Flash = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "gemini-1.5-Flash",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
        level: 2,
      },
      topK: {
        field: "slider",
        min: 1,
        max: 40,
        step: 1,
        default: 40,
        level: 2,
      },
      topP: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      maxOutputTokens: {
        field: "slider",
        min: 1,
        max: 8192,
        step: 1,
        default: 2048,
        level: 0,
      },
      stopSequences: {
        field: "text",
        default: "",
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.input_tokens",
          output_tokens: "usage.output_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: 0,
        },
      ],
      message: "candidates[0].content.parts[0].text",
      role: "model",
    };
    const inputConfig = {
      model: {
        default: {
          role: "model",
          parts: [
            {
              text: "",
            },
          ],
        },
        contentKey: "parts[0].text",
        type: "json",
      },
      content_location: "prompt",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };

  static gemini_1_0_pro = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "gemini-1.0-pro",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
        level: 2,
      },
      topK: {
        field: "slider",
        min: 1,
        max: 40,
        step: 1,
        default: 40,
        level: 2,
      },
      topP: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      maxOutputTokens: {
        field: "slider",
        min: 1,
        max: 8192,
        step: 1,
        default: 2048,
        level: 0,
      },
      stopSequences: {
        field: "text",
        default: "",
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.input_tokens",
          output_tokens: "usage.output_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: 0,
        },
      ],
      message: "candidates[0].content.parts[0].text",
      role: "model",
    };
    const inputConfig = {
      model: {
        default: {
          role: "model",
          parts: [
            {
              text: "",
            },
          ],
        },
        contentKey: "parts[0].text",
        type: "json",
      },
      content_location: "prompt",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };

  static gemini_1_0_pro_vision = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "gemini-1.0-pro-vision",
        level: 1,
      },
      temperature: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
        level: 2,
      },
      topK: {
        field: "slider",
        min: 1,
        max: 40,
        step: 1,
        default: 40,
        level: 2,
      },
      topP: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      maxOutputTokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 2048,
        level: 0,
      },
      stopSequences: {
        field: "text",
        default: "",
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.input_tokens",
          output_tokens: "usage.output_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: 0,
        },
      ],
      message: "candidates[0].content.parts[0].text",
      role: "model",
    };
    const inputConfig = {
      model: {
        default: {
          role: "model",
          parts: [
            {
              text: "",
            },
          ],
        },
        contentKey: "parts[0].text",
        type: "json",
      },
      content_location: "prompt",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  };
  static claude_3_5_sonnet_20240620 = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "claude-3-5-sonnet-20240620",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 8192,
        step: 1,
        default: 1046,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
    };

    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.input_tokens",
          completion_tokens: "usage.output_tokens",
          total_cost: "usage.total_cost",
        },
      ],
      message: "content[0].text",
      tools: "content[1].text",
      assistant: "role",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration: configuration,
      outputConfig: outputConfig,
      inputConfig: inputConfig,
    };
  };

  static claude_3_opus_20240229 = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "claude-3-opus-20240229",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 1046,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      // "logprobs": {
      //     "field": "boolean",
      //     "default": false,
      //     "level": 0,
      //     "typeOf": "boolean"
      // },
      // "frequency_penalty": {
      //     "field": "slider",
      //     "min": 0,
      //     "max": 2,
      //     "step": 0.01,
      //     "default": 0,
      //     "level": 2
      // },
      // "presence_penalty": {
      //     "field": "slider",
      //     "min": 0,
      //     "max": 2,
      //     "step": 0.01,
      //     "default": 0,
      //     "level": 2
      // },
      // "response_count": {
      //     "field": "number",
      //     "default": 1,
      //     "typeOf": "number",
      //     "level": 0
      // },
      // "stop": {
      //     "field": "text",
      //     "default": "",
      //     "level": 0
      // },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      // "tool_choice": {
      //     "field": "text",
      //     "default": "auto",
      //     "level": 0,
      //     "typeOf": "string"
      // },
      // "response_format": {
      //     "field": "boolean",
      //     "default": {
      //         "type": "text"
      //     },
      //     "level": 0
      // }
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.input_tokens",
          completion_tokens: "usage.output_tokens",
          total_cost: {
            input_cost: 0,
            output_cost: 0,
          },
        },
      ],
      message: "content[0].text",
      tools: "content[1].type",
      assistant: "role",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration: configuration,
      outputConfig: outputConfig,
      inputConfig: inputConfig,
    };
  };

  static claude_3_sonnet_20240229 = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "claude-3-sonnet-20240229",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 1046,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      // "logprobs": {
      //     "field": "boolean",
      //     "default": false,
      //     "level": 0,
      //     "typeOf": "boolean"
      // },
      // "frequency_penalty": {
      //     "field": "slider",
      //     "min": 0,
      //     "max": 2,
      //     "step": 0.01,
      //     "default": 0,
      //     "level": 2
      // },
      // "presence_penalty": {
      //     "field": "slider",
      //     "min": 0,
      //     "max": 2,
      //     "step": 0.01,
      //     "default": 0,
      //     "level": 2
      // },
      // "response_count": {
      //     "field": "number",
      //     "default": 1,
      //     "typeOf": "number",
      //     "level": 0
      // },
      // "stop": {
      //     "field": "text",
      //     "default": "",
      //     "level": 0
      // },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      // "tool_choice": {
      //     "field": "text",
      //     "default": "auto",
      //     "level": 0,
      //     "typeOf": "string"
      // },
      // // "response_format": {
      //     "field": "boolean",
      //     "default": {
      //         "type": "text"
      //     },
      //     "level": 0
      // }
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.input_tokens",
          completion_tokens: "usage.output_tokens",
          total_cost: {
            input_cost: 0,
            output_cost: 0,
          },
        },
      ],
      message: "content[0].text",
      tools: "content[1].type",
      assistant: "role",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration: configuration,
      outputConfig: outputConfig,
      inputConfig: inputConfig,
    };
  };

  static claude_3_haiku_20240307 = () => {
    const configuration = {
      model: {
        field: "drop",
        default: "claude-3-haiku-20240307",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 1046,
        level: 2,
      },
      top_p: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.input_tokens",
          completion_tokens: "usage.output_tokens",
          total_cost: {
            input_cost: 0,
            output_cost: 0,
          },
        },
      ],
      message: "content[0].text",
      tools: "content[1].type",
      assistant: "role",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration: configuration,
      outputConfig: outputConfig,
      inputConfig: inputConfig,
    };
  };

  static llama_3_1_405b_reasoning() {
    const configuration = {
      model: {
        field: "drop",
        default: "llama-3.1-405b-reasoning",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  }

  static llama_3_1_70b_versatile() {
    const configuration = {
      model: {
        field: "drop",
        default: "llama-3.1-70b-versatile",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  }

  static llama_3_1_8b_instant() {
    const configuration = {
      model: {
        field: "drop",
        default: "llama-3.1-8b-instant",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  }

  static llama3_groq_70b_8192_tool_use_preview() {
    const configuration = {
      model: {
        field: "drop",
        default: "llama3-groq-70b-8192-tool-use-preview",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  }
  static llama3_groq_8b_8192_tool_use_preview() {
    const configuration = {
      model: {
        field: "drop",
        default: "llama3-groq-8b-8192-tool-use-preview",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  }

  static llama3_70b_8192() {
    const configuration = {
      model: {
        field: "drop",
        default: "llama3-70b-8192",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  }

  static llama3_8b_8192() {
    const configuration = {
      model: {
        field: "drop",
        default: "llama3-8b-8192",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  }

  static mixtral_8x7b_32768() {
    const configuration = {
      model: {
        field: "drop",
        default: "mixtral-8x7b-32768",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  }

  static gemma_7b_it() {
    const configuration = {
      model: {
        field: "drop",
        default: "gemma-7b-it",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  }

  static gemma2_9b_it() {
    const configuration = {
      model: {
        field: "drop",
        default: "gemma2-9b-it",
        level: 1,
      },
      creativity_level: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0,
        level: 2,
      },
      max_tokens: {
        field: "slider",
        min: 1,
        max: 4096,
        step: 1,
        default: 256,
        level: 2,
      },
      probability_cutoff: {
        field: "slider",
        min: 0,
        max: 1,
        step: 0.1,
        default: 1,
        level: 2,
      },
      log_probability: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      repetition_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      novelty_penalty: {
        field: "slider",
        min: 0,
        max: 2,
        step: 0.01,
        default: 0,
        level: 2,
      },
      response_count: {
        field: "number",
        default: 1,
        typeOf: "number",
        level: 0,
      },
      stop: {
        field: "text",
        default: "",
        level: 0,
      },
      stream: {
        field: "boolean",
        default: false,
        level: 0,
        typeOf: "boolean",
      },
      tools: {
        field: "array",
        level: 0,
        default: [],
        typeOf: "array",
      },
      tool_choice: {
        field: "text",
        default: "auto",
        level: 0,
        typeOf: "string",
      },
      response_type: {
        field: "select",
        options: [{ type: "text" }, { type: "json_object" }],
        default: {
          type: "text",
        },
        level: 0,
      },
    };
    const outputConfig = {
      usage: [
        {
          prompt_tokens: "usage.prompt_tokens",
          completion_tokens: "usage.completion_tokens",
          total_tokens: "usage.total_tokens",
          total_cost: {
            input_cost: 0.01,
            output_cost: 0.03,
          },
        },
      ],
      message: "choices[0].message.content",
      tools: "choices[0].message.tool_calls",
      assistant: "choices[0].message",
      id: "id",
    };
    const inputConfig = {
      system: {
        role: "system",
        content: "",
        contentKey: "content",
        type: "json",
      },
      content_location: "prompt[0].content",
    };
    return {
      configuration,
      outputConfig,
      inputConfig,
    };
  }
}

export default ModelsConfig;
