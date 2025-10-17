import models from "../../models/index.js";
import Sequelize from "sequelize";
import Thread from "../mongoModel/threadModel.js";
import { findInCache, storeInCache } from "../cache_service/index.js";
import { getUsers } from "../services/proxyService.js";
import { getDisplayName } from "../services/threadService.js";

async function getHistory(bridge_id, timestamp) {
  try {
    const history = await models.pg.system_prompt_versionings.findAll({
      where: {
        bridge_id,
        updated_at: {
          [Sequelize.Op.lte]: timestamp
        }
      },
      order: [
        ['updated_at', 'DESC'],
      ],
      limit: 1
    });

    return { success: true, system_prompt: history[0].system_prompt };
  } catch (error) {
    console.error("get history system prompt error=>", error)
    return { success: false, message: "Prompt not found" };
  }
}


async function findMessage(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize, user_feedback, version_id, isChatbot, error) {
  const offset = page && pageSize ? (page - 1) * pageSize : null;
  const limit = pageSize || null;
  
  // Build the WHERE clause for the SQL query
  let whereConditions = [
    `agent_conversations.org_id = '${org_id}'`,
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
    whereConditions.push(`agent_conversations.error != ''`);
  }
  
  const whereClause = whereConditions.join(' AND ');
  
  let countResult = [{ total: 0 }];
  // Only execute count query if not chatbot
  if (!isChatbot) {
    const countQuery = `
      SELECT COUNT(*) as total
      FROM agent_conversations
      WHERE agent_conversations.org_id = '${org_id}'
        AND thread_id = '${thread_id}'
        AND bridge_id = '${bridge_id}'
        AND sub_thread_id = '${sub_thread_id}'
        AND agent_conversations.error != ''
    `;
    countResult = await models.pg.sequelize.query(countQuery, { type: models.pg.sequelize.QueryTypes.SELECT });
  }
  
  // Main query without raw_data join since data is now merged
  let query;
  if (isChatbot) {
    // Only select the required keys for chatbot
    query = `
      SELECT 
        agent_conversations.id as "Id",
        CASE 
          WHEN agent_conversations.user_message IS NOT NULL AND agent_conversations.user_message != '' THEN agent_conversations.user_message
          WHEN agent_conversations.response IS NOT NULL AND agent_conversations.response != '' THEN agent_conversations.response
          WHEN agent_conversations.chatbot_response IS NOT NULL AND agent_conversations.chatbot_response != '' THEN agent_conversations.chatbot_response
          ELSE ''
        END as content,
        CASE 
          WHEN agent_conversations.user_message IS NOT NULL AND agent_conversations.user_message != '' THEN 'user'
          WHEN agent_conversations.response IS NOT NULL AND agent_conversations.response != '' THEN 'assistant'
          WHEN agent_conversations.chatbot_response IS NOT NULL AND agent_conversations.chatbot_response != '' THEN 'assistant'
          ELSE 'assistant'
        END as role,
        agent_conversations."createdAt",
        agent_conversations.chatbot_response as chatbot_message,
        agent_conversations.tools_call_data,
        agent_conversations.user_feedback,
        agent_conversations.sub_thread_id,
        agent_conversations.image_urls,
        agent_conversations.urls,
        agent_conversations.message_id,
        agent_conversations.fallback_model,
        agent_conversations.error,
        agent_conversations."firstAttemptError"
      FROM agent_conversations
      WHERE ${whereClause}
      ORDER BY agent_conversations.id DESC
    `;
  } else {
    query = `
      SELECT 
        CASE 
          WHEN agent_conversations.user_message IS NOT NULL AND agent_conversations.user_message != '' THEN agent_conversations.user_message
          WHEN agent_conversations.response IS NOT NULL AND agent_conversations.response != '' THEN agent_conversations.response
          WHEN agent_conversations.chatbot_response IS NOT NULL AND agent_conversations.chatbot_response != '' THEN agent_conversations.chatbot_response
          ELSE ''
        END as content,
        CASE 
          WHEN agent_conversations.user_message IS NOT NULL AND agent_conversations.user_message != '' THEN 'user'
          WHEN agent_conversations.response IS NOT NULL AND agent_conversations.response != '' THEN 'assistant'
          WHEN agent_conversations.chatbot_response IS NOT NULL AND agent_conversations.chatbot_response != '' THEN 'assistant'
          ELSE 'assistant'
        END as role,
        agent_conversations."createdAt",
        agent_conversations.id as "Id",
        agent_conversations.chatbot_response as chatbot_message,
        agent_conversations.revised_response as updated_message,
        agent_conversations.tools_call_data,
        agent_conversations.message_id,
        agent_conversations.user_feedback,
        agent_conversations.sub_thread_id,
        agent_conversations.thread_id,
        agent_conversations.version_id,
        agent_conversations.image_urls,
        agent_conversations.urls,
        agent_conversations."AiConfig",
        agent_conversations.annotations,
        agent_conversations.fallback_model,
        agent_conversations.error,
        agent_conversations.status,
        agent_conversations.authkey_name,
        agent_conversations.latency,
        agent_conversations.service,
        agent_conversations.tokens,
        agent_conversations.variables,
        agent_conversations.finish_reason,
        agent_conversations.model_name,
        agent_conversations.type,
        agent_conversations."firstAttemptError"
      FROM agent_conversations
      WHERE ${whereClause}
      ORDER BY agent_conversations.id DESC
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
  // Since message_by column no longer exists, we need to identify tool_calls messages differently
  // This might need to be updated based on how tool_calls are now stored in the new structure
  const recordsTodelete = await models.pg.agent_conversations.findOne({
    where: {
      org_id,
      thread_id,
      bridge_id,
      // Assuming tool_calls are identified by having tools_call_data
      tools_call_data: { [Sequelize.Op.ne]: null }
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
// Find All conversation db Service
async function findAllThreads(bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search, user_feedback = null, error = false, version_id = null) {
  // Build the base WHERE clause
  let whereClause = {
    'agent_conversations.bridge_id': bridge_id,
    'agent_conversations.org_id': org_id,
  };

  // If user_feedback is provided and is not 'all', include it in the WHERE clause
  if (user_feedback && user_feedback !== "all") {
    whereClause['agent_conversations.user_feedback'] = user_feedback;
  }

  // If there is a date range, add it to the WHERE clause
  if (startTimestamp && endTimestamp) {
    whereClause['agent_conversations.updatedAt'] = {
      [Sequelize.Op.between]: [new Date(startTimestamp), new Date(endTimestamp)],
    };
  }

  if (version_id) {
    whereClause['agent_conversations.version_id'] = version_id;
  }

  // Create the raw SQL query
  let query = `
    SELECT 
      agent_conversations."thread_id", 
      MIN(agent_conversations.id) AS "id", 
      agent_conversations."bridge_id", 
      MAX(agent_conversations."updatedAt") AS "updatedAt" 
    FROM 
      agent_conversations 
    WHERE 
      agent_conversations."bridge_id" = :bridge_id 
      AND agent_conversations."org_id" = :org_id 
  `;

  // Dynamically adding filters to the WHERE clause
  if (startTimestamp && endTimestamp) {
    query += `AND agent_conversations."updatedAt" BETWEEN :startTimestamp AND :endTimestamp `;
  }

  if (keyword_search) {
    query += `AND (agent_conversations.user_message LIKE :keyword_search OR agent_conversations.response LIKE :keyword_search OR agent_conversations.chatbot_response LIKE :keyword_search OR agent_conversations.error LIKE :keyword_search OR agent_conversations.thread_id LIKE :keyword_search) `;
  }

  if (user_feedback && user_feedback !== "all") {
    query += `AND agent_conversations."user_feedback" = :user_feedback `;
  }

  if (error){
    query += `AND agent_conversations.error != '' `;
  }

  if (version_id) {
    query += `AND agent_conversations.version_id = :version_id `;
  }

  // Add GROUP BY, ORDER BY, LIMIT, and OFFSET
  query += `
    GROUP BY 
      agent_conversations."thread_id", 
      agent_conversations."bridge_id" 
    ORDER BY 
      MAX(agent_conversations."updatedAt") DESC, 
      agent_conversations."thread_id" ASC 
    LIMIT :limit OFFSET :offset;
  `;

  // Define query parameters
  const queryParams = {
    bridge_id,
    org_id,
    limit,
    offset: (pageNo - 1) * limit,
    keyword_search: keyword_search ? `%${keyword_search}%` : undefined,
    startTimestamp: startTimestamp ? new Date(startTimestamp) : undefined,
    endTimestamp: endTimestamp ? new Date(endTimestamp) : undefined,
    user_feedback: user_feedback || undefined,
    version_id: version_id || undefined,
  };

  // Execute the raw SQL query using Sequelize
  const threads = await models.pg.sequelize.query(query, {
    replacements: queryParams,
    type: Sequelize.QueryTypes.SELECT,
  });

  // Map the raw query result into the desired format
  const uniqueThreads = new Map();

  threads.forEach(thread => {
    const uniqueKey = `${thread.bridge_id}-${thread.thread_id}`;

    // Create the response object
    const response = {
      thread_id: thread.thread_id,
      id: thread.id,
      bridge_id: thread.bridge_id,
      updatedAt: thread.updatedAt,
    };

    // Only store unique thread entries
    if (!uniqueThreads.has(uniqueKey)) {
      uniqueThreads.set(uniqueKey, response);
    }
  });

  // Convert the Map values to an array and return the result
  return Array.from(uniqueThreads.values());
}

async function findAllThreadsUsingKeywordSearch(bridge_id, org_id, keyword_search, version_id) {
  const whereClause = {
    bridge_id,
    org_id
  };
  if(version_id)
  {
    whereClause.version_id = version_id;
  }
  // Handle the keyword search filter
  if (keyword_search) {
    whereClause[Sequelize.Op.and] = [
      {
        [Sequelize.Op.or]: [
          { user_message: { [Sequelize.Op.like]: `%${keyword_search}%` } },
          { response: { [Sequelize.Op.like]: `%${keyword_search}%` } },
          { chatbot_response: { [Sequelize.Op.like]: `%${keyword_search}%` } },
          Sequelize.where(Sequelize.cast(Sequelize.col('thread_id'), 'text'), {
            [Sequelize.Op.like]: `%${keyword_search}%`,
          }),
          Sequelize.where(Sequelize.cast(Sequelize.col('message_id'), 'text'), {
            [Sequelize.Op.like]: `%${keyword_search}%`,
          }),
          Sequelize.where(Sequelize.cast(Sequelize.col('sub_thread_id'), 'text'), {
            [Sequelize.Op.like]: `%${keyword_search}%`,
          }),
          Sequelize.where(Sequelize.cast(Sequelize.col('version_id'), 'text'), {
            [Sequelize.Op.like]: `%${keyword_search}%`,
          }),
        ],
      },
    ];
  }

  // Define the common attributes to select
  const attributes = [
    'thread_id',
    [Sequelize.fn('MIN', Sequelize.col('id')), 'id'],
    'bridge_id',
    [Sequelize.fn('MAX', Sequelize.col('updatedAt')), 'updatedAt'],
    'user_message',
    'response', 
    'chatbot_response',
    'message_id',
    'sub_thread_id',
    'version_id',
  ];

  // Execute the query
  const threads = await models.pg.agent_conversations.findAll({
    attributes,
    where: whereClause,
    group: ['thread_id', 'bridge_id', 'user_message', 'response', 'chatbot_response', 'message_id', 'sub_thread_id', 'version_id'],
    order: [
      [Sequelize.col('updatedAt'), 'DESC'],
      ['thread_id', 'ASC'],
    ],
  });

  // Get display names for unique sub_thread_ids
  const uniqueSubThreadIds = [...new Set(threads.map(t => t.sub_thread_id).filter(Boolean))];
  const displayNamesMap = new Map();
  
  await Promise.all(
    uniqueSubThreadIds.map(async (subThreadId) => {
      const displayName = await getDisplayName(subThreadId);
      displayNamesMap.set(subThreadId, displayName || subThreadId);
    })
  );

  // Helper function to determine which field matched the search
  const getMatchedField = (thread, keyword_search) => {
    // Check user_message
    if (thread.user_message && thread.user_message.includes(keyword_search)) {
      // Check if user_message contains sub_thread_id, prioritize sub_thread_id match
      const isMessageContainsSubThreadId = thread.sub_thread_id && 
        thread.user_message.includes(thread.sub_thread_id.toString());
      return isMessageContainsSubThreadId ? 'sub_thread_id' : 'user_message';
    }
    
    // Check response
    if (thread.response && thread.response.includes(keyword_search)) {
      const isMessageContainsSubThreadId = thread.sub_thread_id && 
        thread.response.includes(thread.sub_thread_id.toString());
      return isMessageContainsSubThreadId ? 'sub_thread_id' : 'response';
    }
    
    // Check chatbot_response
    if (thread.chatbot_response && thread.chatbot_response.includes(keyword_search)) {
      const isMessageContainsSubThreadId = thread.sub_thread_id && 
        thread.chatbot_response.includes(thread.sub_thread_id.toString());
      return isMessageContainsSubThreadId ? 'sub_thread_id' : 'chatbot_response';
    }
    
    if (thread.message_id && thread.message_id.toString().includes(keyword_search)) {
      return 'message_id';
    }
    
    if (thread.thread_id && thread.thread_id.toString().includes(keyword_search)) {
      return 'thread_id';
    }
    
    if (thread.sub_thread_id && thread.sub_thread_id.toString().includes(keyword_search)) {
      return 'sub_thread_id';
    }
    
    return 'thread_id';
  };

  // Helper function to create message object
  const createMessageObj = (thread) => {
    // Determine the message content based on available fields
    let message = thread.user_message || thread.response || thread.chatbot_response || '';
    return {
      message: message,
      message_id: thread.message_id
    };
  };

  // Helper function to add sub_thread entry
  const addSubThreadEntry = (response, thread, displayNamesMap) => {
    if (!response.sub_thread) {
      response.sub_thread = [];
    }

    const existingSubThread = response.sub_thread.find(st => st.sub_thread_id === thread.sub_thread_id);
    
    if (existingSubThread) {
      existingSubThread.messages.push(createMessageObj(thread));
    } else {
      response.sub_thread.push({
        sub_thread_id: thread.sub_thread_id,
        display_name: displayNamesMap.get(thread.sub_thread_id),
        messages: [createMessageObj(thread)]
      });
    }
  };

  // Helper function to add main thread message
  const addMainThreadMessage = (response, thread) => {
    if (!response.message) {
      response.message = [];
    }
    response.message.push(createMessageObj(thread));
  };

  // Helper function to handle message/message_id matches
  const handleMessageMatch = (response, thread, displayNamesMap) => {
    if (thread.sub_thread_id) {
      addSubThreadEntry(response, thread, displayNamesMap);
    } else {
      addMainThreadMessage(response, thread);
    }
  };

  const uniqueThreads = new Map();

  // Process threads synchronously (fixed async forEach issue)
  for (const thread of threads) {
    const matchedField = getMatchedField(thread, keyword_search);
    const uniqueKey = matchedField === 'thread_id' ? `${thread.bridge_id}-${thread.thread_id}` : null;

    // Only add unique entries for thread_id matches, allow duplicates otherwise
    if (matchedField !== 'thread_id' || !uniqueThreads.has(uniqueKey)) {
      const response = {
        thread_id: thread.thread_id,
        id: thread.id,
        bridge_id: thread.bridge_id,
        matchedField
      };

      // Handle different match types
      if (matchedField === 'user_message' || matchedField === 'response' || matchedField === 'chatbot_response' || matchedField === 'message_id') {
        handleMessageMatch(response, thread, displayNamesMap);
      } else if (matchedField === 'sub_thread_id') {
        addSubThreadEntry(response, thread, displayNamesMap);
      }

      // Store or merge with existing thread
      if (matchedField === 'thread_id') {
        uniqueThreads.set(thread.thread_id, response);
      } else if (uniqueThreads.has(thread.thread_id)) {
        const existingThread = uniqueThreads.get(thread.thread_id);
        
        if (matchedField === 'user_message' || matchedField === 'response' || matchedField === 'chatbot_response' || matchedField === 'message_id') {
          handleMessageMatch(existingThread, thread, displayNamesMap);
        } else if (matchedField === 'sub_thread_id') {
          addSubThreadEntry(existingThread, thread, displayNamesMap);
        }
      } else {
        uniqueThreads.set(thread.thread_id, response);
      }
    }
  }

  return Array.from(uniqueThreads.values());
}

async function storeSystemPrompt(promptText, orgId, bridgeId) {
  try {
    await models.pg.system_prompt_versionings.create({
      system_prompt: promptText,
      org_id: orgId,
      bridge_id: bridgeId,
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Error storing system prompt:', error);
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

  let conversations = await models.pg.agent_conversations.findAll({
    attributes: [
      [Sequelize.literal(`
        CASE 
          WHEN user_message IS NOT NULL AND user_message != '' THEN user_message
          WHEN response IS NOT NULL AND response != '' THEN response
          WHEN chatbot_response IS NOT NULL AND chatbot_response != '' THEN chatbot_response
          ELSE ''
        END
      `), 'content'],
      [Sequelize.literal(`
        CASE 
          WHEN user_message IS NOT NULL AND user_message != '' THEN 'user'
          WHEN response IS NOT NULL AND response != '' THEN 'assistant'
          WHEN chatbot_response IS NOT NULL AND chatbot_response != '' THEN 'assistant'
          ELSE 'assistant'
        END
      `), 'role'],
      'createdAt',
      'id',
      ['revised_response', 'updated_message'],
      'error'
    ],
    where: {
      ...whereClause,
      [Sequelize.Op.or]: [
        { error: '' },
        { error: { [Sequelize.Op.is]: null } }
      ]
    },
    order: [['id', 'DESC']],
    raw: true
  });

  conversations = conversations.reverse();
  return conversations;
}

async function system_prompt_data(org_id, bridge_id)
{
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

  const [affectedCount, affectedRows] = await models.pg.agent_conversations.update(
    { revised_response : message },
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
      content: row.user_message || row.response || row.chatbot_response || '', 
      role: row.user_message ? 'user' : 'assistant',
      updated_message: row.revised_response,
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

    const [affectedCount, affectedRows] = await models.pg.agent_conversations.update(
      { user_feedback : status },
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

async function userFeedbackCounts({ bridge_id, startDate, endDate, user_feedback }) {
  const  whereClause = {
    bridge_id,
    user_feedback
  }
  if(startDate && endDate && startDate !== 'null' && endDate !== 'null')
  {
    whereClause.createdAt =  {
      [Sequelize.Op.between]: [startDate, endDate], 
    }
  }
  if (user_feedback === "all" || !user_feedback) {
    whereClause.user_feedback = { [Sequelize.Op.or]: [1,2] };
  } else {
    whereClause.user_feedback = user_feedback;
  }
  const feedbackRecords = await models.pg.agent_conversations.findAll({
    attributes: ["user_feedback"],
    where: whereClause,
    returning: true, 
  });
  return { success: true, result: feedbackRecords.length };
}


async function create(payload) {
  return await models.pg.agent_conversations.create(payload);
}

const findMessageByMessageId = async (bridge_id, org_id, thread_id, message_id) =>  await models.pg.agent_conversations.findOne({
  where: {
    org_id,
    bridge_id,
    thread_id,
    message_id,
    // Since message_by no longer exists, we identify assistant messages by having response or chatbot_response
    [Sequelize.Op.or]: [
      { response: { [Sequelize.Op.ne]: null } },
      { chatbot_response: { [Sequelize.Op.ne]: null } }
    ]
  },
  raw: true,
  limit: 1
});
const addThreadId = async (message_id, thread_id, type) => {
  // Since message_by no longer exists, we need to update the where clause
  let whereClause = { message_id };
  
  // Add type-specific conditions based on the new column structure
  if (type === 'user') {
    whereClause.user_message = { [Sequelize.Op.ne]: null };
  } else if (type === 'assistant') {
    whereClause[Sequelize.Op.or] = [
      { response: { [Sequelize.Op.ne]: null } },
      { chatbot_response: { [Sequelize.Op.ne]: null } }
    ];
  }
  
  return await models.pg.agent_conversations.update(
    { external_reference: thread_id },
    {
      where: whereClause,
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

  let conversations = await models.pg.agent_conversations.findAll({
    attributes: [
      [Sequelize.literal(`
        CASE 
          WHEN user_message IS NOT NULL AND user_message != '' THEN user_message
          WHEN response IS NOT NULL AND response != '' THEN response
          WHEN chatbot_response IS NOT NULL AND chatbot_response != '' THEN chatbot_response
          ELSE ''
        END
      `), 'content'],
      [Sequelize.literal(`
        CASE 
          WHEN user_message IS NOT NULL AND user_message != '' THEN 'user'
          WHEN response IS NOT NULL AND response != '' THEN 'assistant'
          WHEN chatbot_response IS NOT NULL AND chatbot_response != '' THEN 'assistant'
          ELSE 'assistant'
        END
      `), 'role'],
      'createdAt',
      'id',
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


const getSubThreads = async (org_id,thread_id, bridge_id) =>{
    return await Thread.find({ org_id, thread_id, bridge_id });
}

async function sortThreadsByHits(threads) {
  const subThreadIds = [...new Set(threads.map(t => t.sub_thread_id).filter(Boolean))];

  const latestEntries = await models.pg.agent_conversations.findAll({
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
    userData = !userData?.length ? await (async () => {
      let allUserData = [];
      let hasMoreData = true;

      while (hasMoreData) {
        const response = await getUsers(org_id, pageNo, pageSize = 50)
        allUserData = [...allUserData, ...response['data']];
        hasMoreData = response?.totalEntityCount > allUserData.length;
        pageNo++;
      }
      await storeInCache(`user_data_${org_id}`, allUserData, 86400); // Cache for 1 day
      return allUserData;
    })() : JSON.parse(userData);

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

async function getAllDatafromPg(hours = 48) {
  try {
    // determine window start based on input hours (24 or 48)
    const windowStart = new Date(Date.now() - hours * 60 * 60 * 1000);

    // fetch active bridges within the window
    const activeBridgeRecords = await models.pg.agent_conversations.findAll({
      attributes: ['bridge_id', 'org_id'],
      where: { createdAt: { [Sequelize.Op.gte]: windowStart } },
      group: ['bridge_id', 'org_id'],
      raw: true
    });

    // fetch positive/negative feedback counts within the window
    const BridgePositiveNegativeCount = await models.pg.agent_conversations.findAll({
      attributes: [
        'bridge_id',
        'org_id',
        [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN user_feedback = 1 THEN 1 ELSE 0 END`)), 'positive_count'],
        [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN user_feedback = 2 THEN 1 ELSE 0 END`)), 'negative_count']
      ],
      where: { createdAt: { [Sequelize.Op.gte]: windowStart } },
      group: ['bridge_id', 'org_id'],
      raw: true
    });

    // map bridge → org for later lookups
    const bridgeOrgMap = new Map(activeBridgeRecords.map(r => [r.bridge_id, r.org_id]));
    const activeBridges = activeBridgeRecords.map(r => ({
      bridge_id: r.bridge_id,
      org_id: r.org_id
    }));

    // fetch all messages in the window for hit counts
    const recentMessages = await models.pg.agent_conversations.findAll({
      attributes: [
        'bridge_id', 
        'createdAt',
        [Sequelize.literal(`
          CASE 
            WHEN user_message IS NOT NULL AND user_message != '' THEN 'user'
            WHEN response IS NOT NULL AND response != '' THEN 'assistant'
            WHEN chatbot_response IS NOT NULL AND chatbot_response != '' THEN 'assistant'
            WHEN tools_call_data IS NOT NULL THEN 'tools_call'
            ELSE 'assistant'
          END
        `), 'message_by']
      ],
      where: { createdAt: { [Sequelize.Op.gte]: windowStart } },
      order: [['bridge_id', 'ASC'], ['createdAt', 'ASC']],
      raw: true
    });

    // group messages by bridge_id
    const hitBuffers = {};
    recentMessages.forEach(msg => {
      const bid = msg.bridge_id;
      if (!hitBuffers[bid]) hitBuffers[bid] = [];
      hitBuffers[bid].push(msg.message_by);
    });

    // compute hits per bridge (user→assistant or user→tools_call→assistant)
    const hitsPerBridge = {};
    for (const bid in hitBuffers) {
      const seq = hitBuffers[bid];
      let count = 0;
      let i = 0;
      while (i < seq.length) {
        if (seq[i] === 'user') {
          if (seq[i + 1] === 'assistant') {
            count++;
            i += 2;
            continue;
          }
          if (seq[i + 1] === 'tools_call' && seq[i + 2] === 'assistant') {
            count++;
            i += 3;
            continue;
          }
        }
        i++;
      }
      hitsPerBridge[bid] = {
        org_id: bridgeOrgMap.get(bid) || null,
        hits: count
      };
    }

    // overall average response time in window
    const averageResponseTimeArr = await models.pg.agent_conversations.findAll({
      attributes: [
        [Sequelize.literal(
          `AVG((latency->>'over_all_time')::float - (latency->>'model_execution_time')::float)`
        ), 'average_response_time']
      ],
      where: { 
        createdAt: { [Sequelize.Op.gte]: windowStart },
        latency: { [Sequelize.Op.ne]: null }
      },
      raw: true
    });
    const averageResponseTime = parseFloat(averageResponseTimeArr[0]?.average_response_time) || 0;

    // per-bridge average response time in window
    const convoRecords = await models.pg.agent_conversations.findAll({
      attributes: ['message_id', 'bridge_id', 'latency'],
      where: {
        createdAt: { [Sequelize.Op.gte]: windowStart },
        user_message: { [Sequelize.Op.ne]: null },
        latency: { [Sequelize.Op.ne]: null }
      },
      raw: true
    });

    // accumulate latency diffs per bridge
    const tmp = {};
    convoRecords.forEach(r => {
      const bid = r.bridge_id;
      if (!bid || !r.latency) return;
      const totalTime = parseFloat(r.latency.over_all_time);
      const execTime = parseFloat(r.latency.model_execution_time);
      const diff = totalTime - execTime;
      if (!tmp[bid]) tmp[bid] = { sum: 0, count: 0 };
      tmp[bid].sum += diff;
      tmp[bid].count++;
    });

    const averageResponseTimePerBridge = {};
    for (const bid in tmp) {
      const avg = tmp[bid].count > 0 ? tmp[bid].sum / tmp[bid].count : 0;
      averageResponseTimePerBridge[bid] = {
        org_id: bridgeOrgMap.get(bid) || null,
        average_response_time: avg
      };
    }

    return {
      activeBridges,
      hitsPerBridge,
      averageResponseTime,
      averageResponseTimePerBridge,
      BridgePositiveNegativeCount
    };
  } catch (error) {
    console.error('getAllData error =>', error);
    return { success: false, message: 'Error fetching active bridges' };
  }
}

async function getSubThreadsByError(org_id, thread_id, bridge_id, version_id, isError) {
  try {
    let conversationsWhereClause = {
      org_id,
      thread_id,
      bridge_id
    };
    
    // Apply version_id filter to the conversations table
    if (version_id) {
      conversationsWhereClause.version_id = version_id;
    }
    
    // Apply error filter directly to conversations table since data is now merged
    if(isError) {
      conversationsWhereClause.error = {
        [models.pg.Sequelize.Op.ne]: ''
      };
    }
    
    const result = await models.pg.agent_conversations.findAll({
      attributes: [
        'sub_thread_id',
        'version_id',
        [models.pg.Sequelize.fn('MAX', models.pg.Sequelize.col('created_at')), 'latest_error']
      ],
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
    const conversationActivity = await models.pg.agent_conversations.findAll({
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
  getAllDatafromPg,
  getSubThreadsByError,
  findAllThreadsUsingKeywordSearch,
  sortThreadsByLatestActivity
};
