import models from "../../models/index.js";

function transformHistory(record) {
  // record.messages is an object with model IDs as keys and messages as values
  const messagesObj = record.messages || {};
  const messageValues = Object.values(messagesObj);
  const lastUserMessage = messageValues.length > 0 ? messageValues[messageValues.length - 1] || '' : '';
  
  // Calculate total tokens from all models
  const tokensObj = record.tokens || {};
  const totalInputTokens = Object.values(tokensObj).reduce((sum, token) => sum + (token.inputTokens || 0), 0);
  const totalOutputTokens = Object.values(tokensObj).reduce((sum, token) => sum + (token.outputTokens || 0), 0);
  const tokensUsed = totalInputTokens + totalOutputTokens;

  return {
    id: record.id,
    createdAt: record.createdAt,
    thread_id: record.thread_id,
    model_name: record.model_name?.name || JSON.stringify(record.model_name),
    last_user_message: lastUserMessage,
    tokens_used: tokensUsed,
    latency_ms: (() => {
      const latencyObj = record.latency || {};
      const latencyValues = Object.values(latencyObj);
      return latencyValues.length > 0 ? 
        Math.max(...latencyValues.map(l => l.over_all_time || 0)) : 0;
    })(),
    has_error: !!record.error,
  };
}

async function getOrchestratorHistory(org_id, orchestrator_id, page, pageSize) {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const { count, rows } = await models.pg.orchestrator_history.findAndCountAll({
    where: {
      org_id,
      orchestrator_id,
    },
    order: [['createdAt', 'DESC']],
    offset,
    limit,
    raw: true,
  });

  // Return raw data without transformation
  return {
    page: page,
    limit: limit,
    total: count,
    data: rows,
  };
}

export default {
  getOrchestratorHistory,
};
