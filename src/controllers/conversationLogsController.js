import { getConversationLogs, getRecentThreads } from "../db_services/conversationLogsDbService.js";

/**
 * GET /conversation-logs/:bridge_id/:thread_id/:sub_thread_id
 * Get conversation logs with pagination
 */
const getConversationLogsController = async (req, res, next) => {
  try {
    const { bridge_id, thread_id, sub_thread_id } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const org_id = req.body.org_id; // From middleware
    
    // Validate required parameters
    if (!bridge_id || !thread_id || !sub_thread_id) {
      res.locals = {
        message: "bridge_id, thread_id, and sub_thread_id are required parameters",
        success: false
      };
      req.statusCode = 400;
      return next();
    }
    
    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      res.locals = {
        message: "Page must be a positive integer",
        success: false
      };
      req.statusCode = 400;
      return next();
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.locals = {
        message: "Limit must be a positive integer between 1 and 100",
        success: false
      };
      req.statusCode = 400;
      return next();
    }
    
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
    const { bridge_id } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const org_id = req.body.org_id; // From middleware
    
    // Validate required parameters
    if (!bridge_id) {
      res.locals = {
        message: "bridge_id is required parameter",
        success: false
      };
      req.statusCode = 400;
      return next();
    }
    
    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      res.locals = {
        message: "Page must be a positive integer",
        success: false
      };
      req.statusCode = 400;
      return next();
    }
    
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
    res.locals = {
      message: "Internal server error",
      success: false
    };
    req.statusCode = 500;
    return next();
  }
};

export { getConversationLogsController, getRecentThreadsController };
