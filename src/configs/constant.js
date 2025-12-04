const collectionNames = {
  ApikeyCredentials: 'ApikeyCredentials',
  configuration: 'configuration',
  Folder: 'Folder'
};

const bridge_ids = {
  'gpt_memory': '6752d9fc232e8659b2b65f0d',
  'suggest_model': '67a75ab42d85a6d4f16a4c7e',
  'make_question': '67459164ea7147ad4b75f92a',
  'optimze_prompt': '6843d832aab19264b8967f3b',
  'create_bridge_using_ai': '67e4e7934e58b9c3b991a29c',
  'structured_output_optimizer': '67766c4eec020b944b3e0670',
  'chatbot_response_with_actions': '67b3157bdd16f681b71b06a4',
  'chatbot_response_without_actions': '67b30d46f8ab2d672f1682b4',
  'get_csv_query_type': '67c2f4b40ef03932ed9a2b40',
  'chatbot_suggestions': '674710c9141fcdaeb820aeb8',
  'generate_summary': '679ca9520a9b42277fd2a3c1',
  'function_agrs_using_ai': '67c81a424f3136bfb0e81906',
  'compare_result': '67ce993c8407023ad4f7b277',
  'generate_description': '6800d48f7dfc8ddcc495f918',
  'improve_prompt_optimizer': '68e4ac02739a8b89ba27b22a',
  'generate_test_cases': '68e8d1fbf8c9ba2043cf7afd'
};

const redis_keys = {
  bridgeusedcost_: 'bridgeusedcost_',
  folderusedcost_: 'folderusedcost_',
  apikeyusedcost_: 'apikeyusedcost_',
  bridge_data_with_tools_: 'bridge_data_with_tools_',
  get_bridge_data_: 'get_bridge_data_',
  apikeylastused_: 'apikeylastused_',
  bridgelastused_: 'bridgelastused_',
  files_: 'files_',
  gpt_memory_: 'gpt_memory_',
  pdf_url_: 'pdf_url_',
  metrix_bridges_: 'metrix_bridges_',
  rate_limit_: 'rate_limit_',
  openai_batch_: 'openai_batch_',
  avg_response_time_: 'avg_response_time_',
  timezone_and_org_: 'timezone_and_org_',
  conversation_: 'conversation_',
  last_transffered_agent_: 'last_transffered_agent_'
};

const cost_types = {
  bridge: 'bridge',
  folder: 'folder',
  apikey: 'apikey'
}

const prebuilt_prompt_bridge_id = ['optimze_prompt', 'gpt_memory', 'structured_output_optimizer', 'chatbot_suggestions', 'generate_summary', 'generate_test_cases'];

const new_agent_service = {
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-20240620",
  groq: "llama3-70b-8192",
  open_router: "openai/gpt-4o",
  mistral: "mistral-large-latest",
  gemini: "gemini-1.5-pro-latest",
  ai_ml: "gpt-oss-120b",
  grok: "grok-beta"
};

export {
  collectionNames,
  bridge_ids,
  redis_keys,
  cost_types,
  prebuilt_prompt_bridge_id,
  new_agent_service
};