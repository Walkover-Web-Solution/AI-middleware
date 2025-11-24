'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting data migration from conversations and raw_data to conversation_logs...');
      
      // Step 1: Get all unique message_ids from conversations table
      const [messageIds] = await queryInterface.sequelize.query(
        `SELECT DISTINCT message_id, MIN("createdAt") as created_at
         FROM conversations 
         WHERE message_id IS NOT NULL 
         GROUP BY message_id
         ORDER BY MIN("createdAt")`,
        { transaction }
      );
      
      console.log(`Found ${messageIds.length} unique message_ids to process`);
      
      let migratedCount = 0;
      let errorCount = 0;
      const batchSize = 100;
      
      // Process in batches for better performance
      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);
        const messageIdsBatch = batch.map(row => row.message_id);
        
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(messageIds.length/batchSize)} (${messageIdsBatch.length} message_ids)...`);
        
        // Step 2: For each message_id, get all related conversation entries
        const [conversationEntries] = await queryInterface.sequelize.query(
          `SELECT 
            c.id,
            c.org_id,
            c.thread_id,
            c.sub_thread_id,
            c.bridge_id,
            c.version_id,
            c.message,
            c.message_by,
            c.function,
            c.updated_message,
            c.message_id,
            c.user_feedback,
            c.type,
            c.external_reference,
            c."createdAt",
            c."updatedAt"
           FROM conversations c
           WHERE c.message_id = ANY($messageIds::uuid[])
           ORDER BY c.message_id, c."createdAt"`,
          { 
            bind: { messageIds: messageIdsBatch },
            transaction 
          }
        );
        
        // Step 3: Get raw_data for these message_ids
        const [rawDataEntries] = await queryInterface.sequelize.query(
          `SELECT 
            rd.id,
            rd.org_id,
            rd.authkey_name,
            rd.latency,
            rd.service,
            rd.status,
            rd.error,
            rd.model,
            rd.input_tokens,
            rd.output_tokens,
            rd.expected_cost,
            rd.message_id,
            rd.created_at,
            rd.variables
           FROM raw_data rd
           WHERE rd.message_id = ANY($messageIds::uuid[])`,
          { 
            bind: { messageIds: messageIdsBatch },
            transaction 
          }
        );
        
        // Create a map of raw_data by message_id for quick lookup
        const rawDataMap = new Map();
        rawDataEntries.forEach(rd => {
          if (!rawDataMap.has(rd.message_id)) {
            rawDataMap.set(rd.message_id, []);
          }
          rawDataMap.get(rd.message_id).push(rd);
        });
        
        // Step 4: Group conversation entries by message_id
        const conversationsByMessageId = new Map();
        conversationEntries.forEach(entry => {
          if (!conversationsByMessageId.has(entry.message_id)) {
            conversationsByMessageId.set(entry.message_id, []);
          }
          conversationsByMessageId.get(entry.message_id).push(entry);
        });
        
        // Step 5: Transform and prepare data for insertion
        const recordsToInsert = [];
        
        for (const [messageId, conversations] of conversationsByMessageId) {
          try {
            // Initialize the new record
            const newRecord = {
              message_id: messageId,
              llm_message: null,
              user: null,
              chatbot_message: null,
              updated_llm_message: null,
              prompt: null,
              error: null,
              user_feedback: 0,
              tools_call_data: [],
              sub_thread_id: null,
              thread_id: null,
              version_id: null,
              bridge_id: null,
              image_urls: [],
              urls: [],
              AiConfig: null,
              fallback_model: null,
              org_id: null,
              service: null,
              model: null,
              status: false,
              tokens: null,
              variables: null,
              latency: null,
              firstAttemptError: null,
              finish_reason: null,
              parent_id: null,
              child_id: null,
              created_at: null,
              updated_at: null
            };
            
            // Process each conversation entry for this message_id
            for (const conv of conversations) {
              // Set common fields (from any conversation entry, they should be same)
              if (!newRecord.org_id) newRecord.org_id = conv.org_id;
              if (!newRecord.thread_id) newRecord.thread_id = conv.thread_id;
              if (!newRecord.sub_thread_id) newRecord.sub_thread_id = conv.sub_thread_id;
              if (!newRecord.bridge_id) newRecord.bridge_id = conv.bridge_id;
              if (!newRecord.version_id) newRecord.version_id = conv.version_id;
              if (!newRecord.created_at) newRecord.created_at = conv.createdAt;
              if (!newRecord.updated_at) newRecord.updated_at = conv.updatedAt;
              
              // Set user_feedback if available
              if (conv.user_feedback) {
                newRecord.user_feedback = conv.user_feedback;
              }
              
              // Map message based on message_by (role)
              if (conv.message_by === 'user') {
                newRecord.user = conv.message;
              } else if (conv.message_by === 'assistant') {
                newRecord.llm_message = conv.message;
                newRecord.updated_llm_message = conv.updated_message;
              } else if (conv.message_by === 'tool' || conv.message_by === 'tools_call') {
                // Handle tool calls
                if (conv.function) {
                  if (Array.isArray(conv.function)) {
                    newRecord.tools_call_data.push(...conv.function);
                  } else {
                    newRecord.tools_call_data.push(conv.function);
                  }
                }
              }
            }
            
            // Get raw_data for this message_id
            const rawDataList = rawDataMap.get(messageId);
            if (rawDataList && rawDataList.length > 0) {
              // Use the first raw_data entry (or aggregate if needed)
              const rawData = rawDataList[0];
              
              // Map raw_data fields
              newRecord.service = rawData.service;
              newRecord.model = rawData.model;
              newRecord.status = rawData.status;
              newRecord.error = rawData.error;
              newRecord.variables = rawData.variables;
              
              // Create tokens JSON object
              newRecord.tokens = {
                input_tokens: rawData.input_tokens || 0,
                output_tokens: rawData.output_tokens || 0,
                expected_cost: rawData.expected_cost || 0
              };
              
              // Create latency JSON object
              if (rawData.latency) {
                newRecord.latency = {
                  total: rawData.latency
                };
              }
              
              // If multiple raw_data entries exist, aggregate tokens
              if (rawDataList.length > 1) {
                let totalInputTokens = 0;
                let totalOutputTokens = 0;
                let totalExpectedCost = 0;
                let totalLatency = 0;
                
                rawDataList.forEach(rd => {
                  totalInputTokens += rd.input_tokens || 0;
                  totalOutputTokens += rd.output_tokens || 0;
                  totalExpectedCost += rd.expected_cost || 0;
                  totalLatency += rd.latency || 0;
                });
                
                newRecord.tokens = {
                  input_tokens: totalInputTokens,
                  output_tokens: totalOutputTokens,
                  expected_cost: totalExpectedCost
                };
                
                newRecord.latency = {
                  total: totalLatency
                };
              }
            }
            
            recordsToInsert.push(newRecord);
          } catch (err) {
            console.error(`Error processing message_id ${messageId}:`, err.message);
            errorCount++;
          }
        }
        
        // Step 6: Bulk insert records
        if (recordsToInsert.length > 0) {
          // Properly serialize JSONB fields for bulk insert
          const serializedRecords = recordsToInsert.map(record => ({
            ...record,
            tools_call_data: JSON.stringify(record.tools_call_data || []),
            image_urls: JSON.stringify(record.image_urls || []),
            urls: JSON.stringify(record.urls || []),
            AiConfig: record.AiConfig ? JSON.stringify(record.AiConfig) : null,
            fallback_model: record.fallback_model ? JSON.stringify(record.fallback_model) : null,
            tokens: record.tokens ? JSON.stringify(record.tokens) : null,
            variables: record.variables ? JSON.stringify(record.variables) : null,
            latency: record.latency ? JSON.stringify(record.latency) : null
          }));
          
          await queryInterface.bulkInsert('conversation_logs', serializedRecords, { transaction });
          migratedCount += recordsToInsert.length;
          console.log(`Migrated ${recordsToInsert.length} records in this batch (Total: ${migratedCount}/${messageIds.length})`);
        }
      }
      
      await transaction.commit();
      
      console.log('Data migration completed successfully!');
      console.log(`Summary: Migrated ${migratedCount} conversation logs`);
      console.log(`Errors: ${errorCount}`);
      
    } catch (error) {
      await transaction.rollback();
      console.error('Data migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Rolling back data migration...');
      
      // Delete all records from conversation_logs that were migrated
      await queryInterface.bulkDelete('conversation_logs', {}, { transaction });
      
      await transaction.commit();
      console.log('Rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};

