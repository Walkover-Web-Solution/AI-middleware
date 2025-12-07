import { findConversationLogsByIds, findRecentThreadsByBridgeId, findConversationLogsByFilters } from "../db_services/history.service.js";

/**
 * GET /conversation-logs/:bridge_id/:thread_id/:sub_thread_id
 * Get conversation logs with pagination
 */
const getConversationLogs = async (req, res, next) => {
  const org_id = req.profile.org.id; // From middleware
  const { agent_id, thread_id, sub_thread_id } = req.params;
  const pageNum = req.query.page || 1;
  const limitNum = req.query.limit || 30;

  // Get conversation logs
  const result = await findConversationLogsByIds(
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
 * GET /threads/:agent_id
 * Get recent threads by agent_id with pagination
 */
const getRecentThreads = async (req, res, next) => {
  const org_id = req.profile.org.id; // From middleware
  const { agent_id } = req.params;
  const user_feedback = req.query.user_feedback || 'all';
  const error = req.query.error || 'false';
  const pageNum = req.query.page || 1;
  const limitNum = req.query.limit || 30;

  // Get recent threads
  const result = await findRecentThreadsByBridgeId(
    org_id,
    agent_id,
    user_feedback,
    error,
    pageNum,
    limitNum
  );

  if (result.success) {
    res.locals = {
      data: result.data,
      total_user_feedback_count: result.total_user_feedback_count,
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
 * GET /search/:agent_id
 * Search conversation logs with flexible filters
 */
const searchConversationLogs = async (req, res, next) => {
  const org_id = req.profile.org.id; // From middleware
  const { agent_id: bridge_id } = req.params;
  const { keyword, time_range } = req.query;

  // Build filters object from validated request body
  const filters = {
    keyword: keyword
  };

  if (time_range) {
    filters.time_range = time_range;
  }

  // Search conversation logs
  const result = await findConversationLogsByFilters(org_id, bridge_id, filters);

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
  getConversationLogs,
  getRecentThreads,
  searchConversationLogs
};

