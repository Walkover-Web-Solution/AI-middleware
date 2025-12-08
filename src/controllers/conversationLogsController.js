import { getConversationLogs, getRecentThreads } from "../db_services/conversationLogsDbService.js";
import {
  getConversationLogsParamsSchema,
  getRecentThreadsParamsSchema,
  paginationQuerySchema
} from "../validation/joi_validation/conversationLogs.js";

/**
 * GET /conversation-logs/:bridge_id/:thread_id/:sub_thread_id
 * Get conversation logs with pagination
 */
const getConversationLogsController = async (req, res, next) => {
  try {
    const org_id = req.body.org_id; // From middleware

    // Validate URL params
    const validatedParams = await getConversationLogsParamsSchema.validateAsync(req.params);
    const { bridge_id, thread_id, sub_thread_id } = validatedParams;

    // Validate query params
    const validatedQuery = await paginationQuerySchema.validateAsync(req.query);
    const pageNum = validatedQuery.page || 1;
    const limitNum = validatedQuery.limit || 30;

    // Get conversation logs
    const result = await getConversationLogs(
      org_id,
      bridge_id,
      thread_id,
      sub_thread_id,
      pageNum,
      limitNum,
      validatedQuery.version_id
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

  } catch (error) {
    console.error("Error in getConversationLogsController:", error);

    // Handle Joi validation errors
    if (error.isJoi) {
      res.locals = {
        message: error.details[0].message,
        success: false
      };
      req.statusCode = 400;
      return next();
    }

    res.locals = {
      message: "Internal server error",
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

const getRecentThreadsController = async (req, res, next) => {
  try {
    const org_id = req.body.org_id; // From middleware

    // Validate URL params
    const validatedParams = await getRecentThreadsParamsSchema.validateAsync(req.params);
    const { bridge_id } = validatedParams;

    // Validate query params
    const validatedQuery = await paginationQuerySchema.validateAsync(req.query);
    const pageNum = validatedQuery.page || 1;
    const limitNum = validatedQuery.limit || 30;
    const user_feedback = validatedQuery.user_feedback || 'all';
    const error = validatedQuery.error || 'false';
    const version_id = validatedQuery.version_id;

    // Extract search filters
    const filters = {
      keyword: validatedQuery.keyword,
      time_range: (validatedQuery.start_date || validatedQuery.end_date) ? {
        start: validatedQuery.start_date,
        end: validatedQuery.end_date
      } : undefined
    };

    // Get recent threads
    const result = await getRecentThreads(
      org_id,
      bridge_id,
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

  } catch (error) {
    console.error("Error in getRecentThreadsController:", error);

    // Handle Joi validation errors
    if (error.isJoi) {
      res.locals = {
        message: error.details[0].message,
        success: false
      };
      req.statusCode = 400;
      return next();
    }

    res.locals = {
      message: "Internal server error",
      success: false
    };
    req.statusCode = 500;
    return next();
  }
};

export { getConversationLogsController, getRecentThreadsController };
