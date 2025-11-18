import { getOrchestratorConversationLogs, getOrchestratorRecentThreads, searchOrchestratorConversationLogs } from "../db_services/orchestratorConversationLogsDbService.js";
import { 
  getOrchestratorConversationLogsParamsSchema, 
  getOrchestratorRecentThreadsParamsSchema, 
  searchOrchestratorConversationLogsParamsSchema,
  searchOrchestratorConversationLogsBodySchema,
  paginationQuerySchema 
} from "../validation/joi_validation/orchestratorConversationLogs.js";

/**
 * GET /orchestrator-conversation-logs/:bridge_id/:thread_id/:sub_thread_id
 * Get orchestrator conversation logs with pagination
 */
const getOrchestratorConversationLogsController = async (req, res, next) => {
  try {
    const org_id = req.body.org_id; // From middleware
    
    // Validate URL params
    const validatedParams = await getOrchestratorConversationLogsParamsSchema.validateAsync(req.params);
    const { bridge_id, thread_id, sub_thread_id } = validatedParams;
    
    // Validate query params
    const validatedQuery = await paginationQuerySchema.validateAsync(req.query);
    const pageNum = validatedQuery.page || 1;
    const limitNum = validatedQuery.limit || 30;
    
    // Get orchestrator conversation logs
    const result = await getOrchestratorConversationLogs(
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
    console.error("Error in getOrchestratorConversationLogsController:", error);
    
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
 * Get recent orchestrator threads by bridge_id with pagination
 */
const getOrchestratorRecentThreadsController = async (req, res, next) => {
  try {
    const org_id = req.body.org_id; // From middleware
    
    // Validate URL params
    const validatedParams = await getOrchestratorRecentThreadsParamsSchema.validateAsync(req.params);
    const { bridge_id } = validatedParams;
    
    // Validate query params
    const validatedQuery = await paginationQuerySchema.validateAsync(req.query);
    const pageNum = validatedQuery.page || 1;
    const limitNum = validatedQuery.limit || 30;
    
    // Get recent orchestrator threads
    const result = await getOrchestratorRecentThreads(
      org_id,
      bridge_id,
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
    console.error("Error in getOrchestratorRecentThreadsController:", error);
    
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
 * Search orchestrator conversation logs with flexible filters
 */
const searchOrchestratorConversationLogsController = async (req, res, next) => {
  try {
    const org_id = req.body.org_id; // From middleware
    
    // Validate URL params
    const validatedParams = await searchOrchestratorConversationLogsParamsSchema.validateAsync(req.params);
    const { bridge_id } = validatedParams;
    
    // Validate request body
    const validatedBody = await searchOrchestratorConversationLogsBodySchema.validateAsync(req.body);
    const { keyword, time_range } = validatedBody;
    
    // Build filters object from validated request body
    const filters = {
      keyword: keyword
    };
    
    if (time_range) {
      filters.time_range = time_range;
    }
    
    // Search orchestrator conversation logs
    const result = await searchOrchestratorConversationLogs(org_id, bridge_id, filters);
    
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
    console.error("Error in searchOrchestratorConversationLogsController:", error);
    
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

export { getOrchestratorConversationLogsController, getOrchestratorRecentThreadsController, searchOrchestratorConversationLogsController };


