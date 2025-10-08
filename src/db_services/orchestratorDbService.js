import models from "../../models/index.js";

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
