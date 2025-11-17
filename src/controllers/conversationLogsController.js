import { getConversationLogs, getRecentThreads, searchConversationLogs } from "../db_services/conversationLogsDbService.js";

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

/**
 * POST /search/:bridge_id
 * Search conversation logs with flexible filters
 */
const searchConversationLogsController = async (req, res, next) => {
  try {
    const org_id = req.body.org_id; // From middleware
    const { bridge_id } = req.params; // Get bridge_id from URL params
    const { message_id, keywords, thread_id, sub_thread_id, time_range } = req.body;
    
    // Validate required parameter
    if (!bridge_id) {
      res.locals = {
        message: "bridge_id is required parameter",
        success: false
      };
      req.statusCode = 400;
      return next();
    }
    
    // Build filters object from request body
    const filters = {};
    
    if (message_id) {
      filters.message_id = message_id;
    }
    
    if (keywords) {
      filters.keywords = keywords;
    }
    
    if (thread_id) {
      filters.thread_id = thread_id;
    }
    
    if (sub_thread_id) {
      filters.sub_thread_id = sub_thread_id;
    }
    
    if (time_range) {
      filters.time_range = time_range;
    }
    
    // Validate that at least one filter is provided
    if (Object.keys(filters).length === 0) {
      res.locals = {
        message: "At least one search parameter is required (message_id, keywords, thread_id, sub_thread_id, or time_range)",
        success: false
      };
      req.statusCode = 400;
      return next();
    }
    
    // Validate time_range format if provided
    if (time_range) {
      if (time_range.start && isNaN(Date.parse(time_range.start))) {
        res.locals = {
          message: "Invalid start date format in time_range",
          success: false
        };
        req.statusCode = 400;
        return next();
      }
      
      if (time_range.end && isNaN(Date.parse(time_range.end))) {
        res.locals = {
          message: "Invalid end date format in time_range",
          success: false
        };
        req.statusCode = 400;
        return next();
      }
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
    res.locals = {
      message: "Internal server error",
      success: false
    };
    req.statusCode = 500;
    return next();
  }
};

export { getConversationLogsController, getRecentThreadsController, searchConversationLogsController };
