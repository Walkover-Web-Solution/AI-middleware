import { getConversationLogs } from "../db_services/conversationLogsDbService.js";

/**
 * GET /conversation-logs/:bridge_id/:thread_id/:sub_thread_id
 * Get conversation logs with pagination
 */
const getConversationLogsController = async (req, res) => {
  try {
    const { bridge_id, thread_id, sub_thread_id } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const org_id = req.body.org_id; // From middleware
    
    // Validate required parameters
    if (!bridge_id || !thread_id || !sub_thread_id) {
      return res.status(400).json({
        success: false,
        message: "bridge_id, thread_id, and sub_thread_id are required parameters"
      });
    }
    
    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer"
      });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a positive integer between 1 and 100"
      });
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
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
    
  } catch (error) {
    console.error("Error in getConversationLogsController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export { getConversationLogsController };
