import { findConversationLogsByIds, findRecentThreadsByBridgeId } from "../db_services/history.service.js";

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
 * Get recent threads by agent_id with pagination and search functionality
 */
const getRecentThreads = async (req, res, next) => {
  const org_id = req.profile.org.id; // From middleware
  const { agent_id } = req.params;

  // Extract query parameters
  const pageNum = parseInt(req.query.page) || 1;
  const limitNum = parseInt(req.query.limit) || 30;
  const user_feedback = req.query.user_feedback || 'all';
  const error = req.query.error || 'false';
  const version_id = req.query.version_id;

  // Extract search filters (supports both search and regular listing)
  const filters = {
    keyword: req.query.keyword,
    time_range: (req.query.start_date || req.query.end_date) ? {
      start: req.query.start_date,
      end: req.query.end_date
    } : undefined
  };

  // Get recent threads with search functionality built-in
  const result = await findRecentThreadsByBridgeId(
    org_id,
    agent_id,
    filters,
    user_feedback,
    error,
    pageNum,
    limitNum,
    version_id
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


export default {
  getConversationLogs,
  getRecentThreads
};

