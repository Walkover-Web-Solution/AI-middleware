import models from "../../models/index.js";
import Sequelize from "sequelize";
import Thread from "../mongoModel/Thread.model.js";
import { findInCache, storeInCache } from "../cache_service/index.js";
import { getUsers } from "../services/proxy.service.js";
import { getDisplayName } from "../services/thread.service.js";


async function findMessage(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize, user_feedback, version_id, isChatbot, error) {
  const offset = page && pageSize ? (page - 1) * pageSize : null;
  const limit = pageSize || null;

  // Build the WHERE clause for the SQL query
  let whereConditions = [
    `conversations.org_id = '${org_id}'`,
    `thread_id = '${thread_id}'`,
    `bridge_id = '${bridge_id}'`,
    `sub_thread_id = '${sub_thread_id}'`
  ];

  if (version_id !== undefined && version_id) {
    whereConditions.push(`version_id = '${version_id}'`);
  }

  if (user_feedback === "all" || !user_feedback) {
    whereConditions.push(`(user_feedback IS NULL OR user_feedback IN (0, 1, 2))`);
  } else {
    whereConditions.push(`user_feedback = ${user_feedback}`);
  }

  // Add condition for error if error is true
  if (error) {
    whereConditions.push(`raw_data.error != ''`);
  }

  const whereClause = whereConditions.join(' AND ');

  let countResult = [{ total: 0 }];
  // Only execute count query if not chatbot
  if (!isChatbot) {
    const countQuery = `
      SELECT COUNT(*) as total
      FROM conversations
      LEFT JOIN raw_data ON conversations.message_id = raw_data.message_id
      WHERE conversations.org_id = '${org_id}'
        AND thread_id = '${thread_id}'
        AND bridge_id = '${bridge_id}'
        AND sub_thread_id = '${sub_thread_id}'
        AND raw_data.error != ''
    `;
    countResult = await models.pg.sequelize.query(countQuery, { type: models.pg.sequelize.QueryTypes.SELECT });
  }

  // Main query with JOIN to raw_data
  let query;
  if (isChatbot) {
    // Only select the required keys for chatbot
    query = `
      SELECT 
        conversations.id as "Id",
        conversations.message as content,
        conversations.message_by as role,
        conversations."createdAt",
        conversations.chatbot_message,
        conversations.tools_call_data,
        conversations.user_feedback,
        conversations.sub_thread_id,
        conversations.image_urls,
        conversations.urls,
        conversations.message_id,
        conversations.fallback_model,
        raw_data.error,
        raw_data."firstAttemptError"
      FROM conversations
      LEFT JOIN raw_data ON conversations.message_id = raw_data.message_id
      WHERE ${whereClause}
      ORDER BY conversations.id DESC
    `;
  } else {
    query = `
      SELECT 
        conversations.message as content,
        conversations.message_by as role,
        conversations."createdAt",
        conversations.id as "Id",
        conversations.function,
        conversations.is_reset,
        conversations.chatbot_message,
        conversations.updated_message,
        conversations.tools_call_data,
        conversations.message_id,
        conversations.user_feedback,
        conversations.sub_thread_id,
        conversations.thread_id,
        conversations.version_id,
        conversations.image_urls,
        conversations.urls,
        conversations."AiConfig",
        conversations.annotations,
        conversations.fallback_model,
        raw_data.*
      FROM conversations
      LEFT JOIN raw_data ON conversations.message_id = raw_data.message_id
      WHERE ${whereClause}
      ORDER BY conversations.id DESC
    `;
  }

  // Add pagination if needed
  if (limit !== null) {
    query += ` LIMIT ${limit}`;
  }

  if (offset !== null) {
    query += ` OFFSET ${offset}`;
  }

  // Execute main query
  const conversationsResult = await models.pg.sequelize.query(query, { type: models.pg.sequelize.QueryTypes.SELECT });

  // Get total entries from count query
  const totalEntries = parseInt(countResult?.[0]?.total || 0);

  // Sort the results in ascending order (since we queried in DESC but need to reverse)
  const conversations = conversationsResult.reverse();

  // Calculate pagination info only if not chatbot
  const totalPages = isChatbot ? 1 : (limit ? Math.ceil(totalEntries / limit) : 1);

  return { conversations, totalPages, totalEntries: isChatbot ? conversations.length : totalEntries };
}

async function deleteLastThread(org_id, thread_id, bridge_id) {
  const recordsTodelete = await models.pg.conversations.findOne({
    where: {
      org_id,
      thread_id,
      bridge_id,
      message_by: "tool_calls"
    },
    order: [['id', 'DESC']]
  });
  if (recordsTodelete) {
    await recordsTodelete.destroy();
    return {
      success: true
    };
  }
  return {
    success: false
  };
}

async function storeSystemPrompt(promptText, orgId, bridgeId) {
  try {
    const result = await models.pg.system_prompt_versionings.create({
      system_prompt: promptText,
      org_id: orgId,
      bridge_id: bridgeId,
      created_at: new Date(),
      updated_at: new Date()
    });
    return result;
  } catch (error) {
    console.error('Error storing system prompt:', error);
    return null;
  }
}


async function findThreadsForFineTune(org_id, thread_id, bridge_id, user_feedback_array) {
  let whereClause = {
    org_id,
    thread_id,
    bridge_id
  };

  if (user_feedback_array.includes(0)) {
    // If 0 is included, we want all data, so no need to filter by user_feedback
  } else {
    whereClause.user_feedback = {
      [Sequelize.Op.in]: user_feedback_array
    };
  }

  let conversations = await models.pg.conversations.findAll({
    attributes: [
      ['message', 'content'],
      ['message_by', 'role'],
      'createdAt',
      'id',
      'function',
      'updated_message',
      [Sequelize.col('raw_data.error'), 'error']
    ],
    include: [{
      model: models.pg.raw_data,
      as: 'raw_data',
      attributes: [],
      required: false,
      where: {
        [Sequelize.Op.or]: [
          { error: '' },
          { error: { [Sequelize.Op.is]: null } }
        ]
      }
    }],
    where: whereClause,
    order: [['id', 'DESC']],
    raw: true
  });

  conversations = conversations.reverse();
  return conversations;
}

async function system_prompt_data(org_id, bridge_id) {
  const system_prompt = await models.pg.system_prompt_versionings.findOne({
    where: {
      org_id,
      bridge_id
    },
    order: [
      ['updated_at', 'DESC'],
    ],
    raw: true,
    limit: 1
  });

  return system_prompt;
}
async function updateMessage({ org_id, bridge_id, message, id }) {
  try {

    const [affectedCount, affectedRows] = await models.pg.conversations.update(
      { updated_message: message },
      {
        where: {
          org_id,
          bridge_id,
          id
        },
        returning: true,
      }
    );

    if (affectedCount === 0) {
      return { success: false, message: 'No matching record found to update.' };
    }
    const result = affectedRows.map(row => ({
      id: row.id,
      org_id: row.org_id,
      thread_id: row.thread_id,
      model_name: row.model_name,
      bridge_id: row.bridge_id,
      content: row.message,
      role: row.message_by,
      function: row.function,
      updated_message: row.updated_message,
      type: row.type,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    return { success: true, result: result };
  } catch (error) {
    console.error('Error updating message:', error);
    return { success: false, message: 'Error updating message' };
  }
}

async function updateStatus({ status, message_id }) {
  try {

    const [affectedCount, affectedRows] = await models.pg.conversations.update(
      { user_feedback: status },
      {
        where: {
          message_id
        },
        returning: true,
      }
    );
    if (affectedCount === 0) {
      return { success: true, message: 'No matching record found to update.' };
    }

    return { success: true, result: affectedRows };
  } catch (error) {
    console.error('Error updating message:', error);
    return { success: false, message: 'Error updating message' };
  }
}

async function create(payload) {
  return await models.pg.conversations.create(payload);
}

const findMessageByMessageId = async (bridge_id, org_id, thread_id, message_id) => await models.pg.conversations.findOne({
  where: {
    org_id,
    bridge_id,
    thread_id,
    message_id,
    message_by: 'assistant'
  },
  raw: true,
  limit: 1
});
const addThreadId = async (message_id, thread_id, type) => {
  return await models.pg.conversations.update(
    { external_reference: thread_id },
    {
      where: { message_id, message_by: type },
      returning: true
    }
  );
};


async function findThreadMessage(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize) {
  const offset = page && pageSize ? (page - 1) * pageSize : null;
  const limit = pageSize || null;
  const whereClause = {
    org_id: org_id,
    thread_id: thread_id,
    bridge_id: bridge_id,
    sub_thread_id: sub_thread_id
  };

  let conversations = await models.pg.conversations.findAll({
    attributes: [
      [Sequelize.literal(`CASE WHEN message IS NULL OR message = '' THEN chatbot_message ELSE message END`), 'content'],
      ['message_by', 'role'],
      'createdAt',
      'id',
      'is_reset',
      'tools_call_data',
      'image_urls'
    ],
    where: whereClause,
    order: [['id', 'DESC']],
    offset: offset,
    limit: limit,
    raw: true
  });
  conversations = conversations.reverse();
  return { conversations };
}


const getSubThreads = async (org_id, thread_id, bridge_id) => {
  return await Thread.find({ org_id, thread_id, bridge_id });
}

async function sortThreadsByHits(threads) {
  const subThreadIds = [...new Set(threads.map(t => t.sub_thread_id).filter(Boolean))];

  const latestEntries = await models.pg.conversations.findAll({
    attributes: [
      'sub_thread_id',
      [models.pg.sequelize.fn('MAX', models.pg.sequelize.col('createdAt')), 'latestCreatedAt']
    ],
    where: { sub_thread_id: subThreadIds },
    group: ['sub_thread_id'],
    raw: true
  });

  const latestSubThreadMap = new Map(
    latestEntries.map(entry => [entry.sub_thread_id, new Date(entry.latestCreatedAt)])
  );

  threads.sort((a, b) => {
    const dateA = latestSubThreadMap.get(a.sub_thread_id) || new Date(0);
    const dateB = latestSubThreadMap.get(b.sub_thread_id) || new Date(0);
    return dateB - dateA;
  });

  return threads;
}


async function getUserUpdates(org_id, version_id, page = 1, pageSize = 10) {
  try {
    const offset = (page - 1) * pageSize;
    let pageNo = 1;
    let userData = await findInCache(`user_data_${org_id}`);

    // Parse cached data if it exists, otherwise fetch fresh data
    if (userData) {
      try {
        userData = JSON.parse(userData);
        // If parsed data is not an array or is empty, fetch fresh data
        if (!Array.isArray(userData) || userData.length === 0) {
          userData = null;
        }
      } catch {
        // If JSON parsing fails, treat as no cached data
        userData = null;
      }
    }

    if (!userData) {
      let allUserData = [];
      let hasMoreData = true;

      while (hasMoreData) {
        const response = await getUsers(org_id, pageNo, pageSize = 50)
        if (response && Array.isArray(response.data)) {
          allUserData = [...allUserData, ...response.data];
          hasMoreData = response?.totalEntityCount > allUserData.length;
        } else {
          hasMoreData = false;
        }
        pageNo++;
      }
      await storeInCache(`user_data_${org_id}`, allUserData, 86400); // Cache for 1 day
      userData = allUserData;
    }

    const history = await models.pg.user_bridge_config_history.findAll({
      where: {
        org_id: org_id,
        version_id: version_id
      },
      attributes: ['id', 'user_id', 'org_id', 'bridge_id', 'type', 'time', 'version_id'],
      order: [
        ['time', 'DESC'],
      ],
      offset: offset,
      limit: pageSize
    });

    if (history.length === 0) {
      return { success: false, message: "No updates found" };
    }

    const updatedHistory = history?.map(entry => {
      const user = Array.isArray(userData) ? userData.find(user => user?.id === entry?.dataValues?.user_id) : null;
      return {
        ...entry?.dataValues,
        user_name: user ? user?.name : 'Unknown'
      };
    });

    return { success: true, updates: updatedHistory };
  } catch (error) {
    console.error("Error fetching user updates:", error);
    return { success: false, message: "Error fetching updates" };
  }
}

async function getSubThreadsByError(org_id, thread_id, bridge_id, version_id, isError) {
  try {
    let rawDataWhereClause = {};
    let conversationsWhereClause = {
      org_id,
      thread_id,
      bridge_id
    };

    // Apply version_id filter to the conversations table
    if (version_id) {
      conversationsWhereClause.version_id = version_id;
    }

    if (isError) {
      rawDataWhereClause.error = {
        [models.pg.Sequelize.Op.ne]: ''
      };
    }

    const result = await models.pg.conversations.findAll({
      attributes: [
        'sub_thread_id',
        'version_id',
        [models.pg.Sequelize.fn('MAX', models.pg.Sequelize.col('raw_data.created_at')), 'latest_error']
      ],
      include: [{
        model: models.pg.raw_data,
        as: 'raw_data',
        required: true,
        attributes: [],
        where: rawDataWhereClause
      }],
      where: conversationsWhereClause,
      group: ['sub_thread_id', 'version_id'],
      order: [[models.pg.Sequelize.literal('latest_error'), 'DESC']],
      raw: true
    });

    return result.map(item => item.sub_thread_id);
  } catch (error) {
    console.error('getSubThreadsByError error =>', error);
    return [];
  }
}

async function sortThreadsByLatestActivity(threads, org_id, bridge_id) {
  try {
    if (!threads || threads.length === 0) {
      return threads;
    }

    // Extract thread_id and sub_thread_id from threads
    const threadIds = threads.map(thread => ({
      thread_id: thread.thread_id,
      sub_thread_id: thread.sub_thread_id
    }));

    // Query PostgreSQL to get latest conversation activity for each thread
    const conversationActivity = await models.pg.conversations.findAll({
      attributes: [
        'thread_id',
        'sub_thread_id',
        [models.pg.Sequelize.fn('MAX', models.pg.Sequelize.col('createdAt')), 'latest_activity']
      ],
      where: {
        org_id,
        bridge_id,
        [models.pg.Sequelize.Op.or]: threadIds.map(({ thread_id, sub_thread_id }) => ({
          thread_id,
          sub_thread_id
        }))
      },
      group: ['thread_id', 'sub_thread_id'],
      order: [[models.pg.Sequelize.literal('latest_activity'), 'DESC']],
      raw: true
    });

    // Create a map for quick lookup of latest activity
    const activityMap = new Map();
    conversationActivity.forEach(item => {
      const key = `${item.thread_id}_${item.sub_thread_id}`;
      activityMap.set(key, new Date(item.latest_activity));
    });

    // Sort threads based on latest activity (DESC - most recent first)
    const sortedThreads = threads.sort((a, b) => {
      const keyA = `${a.thread_id}_${a.sub_thread_id}`;
      const keyB = `${b.thread_id}_${b.sub_thread_id}`;

      const activityA = activityMap.get(keyA) || new Date(0); // Default to epoch if not found
      const activityB = activityMap.get(keyB) || new Date(0);

      return activityB - activityA; // DESC order
    });

    return sortedThreads;
  } catch (error) {
    console.error('sortThreadsByLatestActivity error =>', error);
    return threads; // Return original threads if sorting fails
  }
}



async function addBulkUserEntries(entries) {
  try {
    if (!entries || entries.length === 0) return { success: true, message: "No entries to add" };

    // Map entries to match the database schema if necessary
    // Assuming user_bridge_config_history model exists in models.pg
    const result = await models.pg.user_bridge_config_history.bulkCreate(entries);

    return { success: true, result };
  } catch (error) {
    console.error("Error adding bulk user entries:", error);
    return { success: false, message: "Error adding bulk user entries" };
  }
}

export default {
  findAllThreads,
  findMessageByMessageId,
  deleteLastThread,
  getHistory,
  storeSystemPrompt,
  findMessage,
  findThreadsForFineTune,
  system_prompt_data,
  updateMessage,
  updateStatus,
  create,
  addThreadId,
  userFeedbackCounts,
  findThreadMessage,
  getSubThreads,
  getUserUpdates,
  sortThreadsByHits,
  getSubThreadsByError,
  findAllThreadsUsingKeywordSearch,
  sortThreadsByLatestActivity,
  addBulkUserEntries
};

