import { findConversationLogsByIds, findRecentThreadsByBridgeId, findConversationLogsByFilters } from "../db_services/history.service.js";
import {
  getConversationLogsParamsSchema,
  getRecentThreadsParamsSchema,
  searchConversationLogsParamsSchema,
  searchConversationLogsBodySchema,
  paginationQuerySchema
} from "../validation/joi_validation/history.validation.js";

/**
 * GET /conversation-logs/:bridge_id/:thread_id/:sub_thread_id
 * Get conversation logs with pagination
 */
const getConversationLogs = async (req, res, next) => {
  const org_id = req.profile.org.id; // From middleware

  // Validate URL params
  const validatedParams = await getConversationLogsParamsSchema.validateAsync(req.params);
  const { bridge_id, thread_id, sub_thread_id } = validatedParams;

  // Validate query params
  const validatedQuery = await paginationQuerySchema.validateAsync(req.query);
  const pageNum = validatedQuery.page || 1;
  const limitNum = validatedQuery.limit || 30;

  // Get conversation logs
  const result = await findConversationLogsByIds(
    org_id,
    bridge_id,
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
 * GET /threads/:bridge_id
 * Get recent threads by bridge_id with pagination
 */
const getRecentThreads = async (req, res, next) => {
  const org_id = req.profile.org.id; // From middleware
  const user_feedback = req.query.user_feedback || 'all';
  const error = req.query.error || 'false';
  // Validate URL params
  const validatedParams = await getRecentThreadsParamsSchema.validateAsync(req.params);
  const { bridge_id } = validatedParams;

  // Validate query params
  const validatedQuery = await paginationQuerySchema.validateAsync(req.query);
  const pageNum = validatedQuery.page || 1;
  const limitNum = validatedQuery.limit || 30;

  // Get recent threads
  const result = await findRecentThreadsByBridgeId(
    org_id,
    bridge_id,
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
 * POST /search/:bridge_id
 * Search conversation logs with flexible filters
 */
const searchConversationLogs = async (req, res, next) => {
  const org_id = req.profile.org.id; // From middleware

  // Validate URL params
  const validatedParams = await searchConversationLogsParamsSchema.validateAsync(req.params);
  const { bridge_id } = validatedParams;

  // Validate request body
  const validatedBody = await searchConversationLogsBodySchema.validateAsync(req.body);
  const { keyword, time_range } = validatedBody;

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

