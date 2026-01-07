import { 
  findOrchestratorConversationLogsByIds, 
  findRecentOrchestratorThreads 
} from "../db_services/orchestratorHistory.service.js";

/**
 * GET /orchestrator-logs/:agent_id/:thread_id/:sub_thread_id
 * Get orchestrator conversation logs with pagination
 */
const getOrchestratorConversationLogs = async (req, res, next) => {
  const org_id = req.profile.org.id; // From middleware
  const { agent_id, thread_id, sub_thread_id } = req.params;
  const pageNum = req.query.page || 1;
  const limitNum = req.query.limit || 30;

  // Get conversation logs
  const result = await findOrchestratorConversationLogsByIds(
    org_id,
    agent_id,
    thread_id,
    sub_thread_id,
    pageNum,
    limitNum
  );

  if (result.success) {
    res.locals = {
      data: result.data,
      success: true
    };
    req.statusCode = 200;
    return next();
  } else {
    res.locals = {
      message: result.message,
      success: false
    };
    req.statusCode = 500;
    return next();
  }
};

/**
 * GET /orchestrator-threads/:agent_id
 * Get recent threads from orchestrator by agent_id with pagination and search functionality
 */
const getRecentOrchestratorThreads = async (req, res, next) => {
  const org_id = req.profile.org.id; // From middleware
  const { agent_id } = req.params;

  // Extract query parameters
  const pageNum = parseInt(req.query.page) || 1;
  const limitNum = parseInt(req.query.limit) || 30;

  // Extract search filters (supports both search and regular listing)
  const filters = {
    keyword: req.query.keyword,
    time_range: (req.query.start_date || req.query.end_date) ? {
      start: req.query.start_date,
      end: req.query.end_date
    } : undefined
  };

  // Get recent threads with search functionality built-in
  const result = await findRecentOrchestratorThreads(
    org_id,
    agent_id,
    filters,
    pageNum,
    limitNum
  );

  if (result.success) {
    res.locals = {
      data: result.data,
      success: true
    };
    req.statusCode = 200;
    return next();
  } else {
    res.locals = {
      message: result.message,
      success: false
    };
    req.statusCode = 500;
    return next();
  }
};


export default {
  getOrchestratorConversationLogs,
  getRecentOrchestratorThreads
};

