import { getConversationLogs, getRecentThreads, searchConversationLogs } from "../db_services/conversationLogsDbService.js";
import { 
  getConversationLogsParamsSchema, 
  getRecentThreadsParamsSchema, 
  searchConversationLogsParamsSchema,
  searchConversationLogsBodySchema,
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
    
    // Get recent threads
    const result = await getRecentThreads(
      org_id,
      bridge_id,
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

/**
 * POST /search/:bridge_id
 * Search conversation logs with flexible filters
 */
const searchConversationLogsController = async (req, res, next) => {
  try {
    const org_id = req.body.org_id; // From middleware
    
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
    const result = await searchConversationLogs(org_id, bridge_id, filters);
    
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
    console.error("Error in searchConversationLogsController:", error);
    
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

export { getConversationLogsController, getRecentThreadsController, searchConversationLogsController };
