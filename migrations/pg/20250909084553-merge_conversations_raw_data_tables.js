'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Step 1: Add all raw_data columns to conversations table
    await queryInterface.addColumn('conversations', 'user_message', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'response', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'chatbot_response', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'response_id', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'revised_response', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'error', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'status', {
      type: Sequelize.BOOLEAN,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'authkey_name', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'latency', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'service', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'input_tokens', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'output_tokens', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'expected_cost', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'variables', {
      type: Sequelize.JSON,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'finish_reason', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'model_name', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'type', {
      type: Sequelize.ENUM('chat', 'completion', 'embedding'),
      allowNull: true
    });

    // Step 2: Migrate existing message data to new structure
    // Update user_message for user messages
    await queryInterface.sequelize.query(`
      UPDATE conversations 
      SET user_message = message 
      WHERE message_by = 'user' AND message IS NOT NULL
    `);

    // Update response for assistant messages
    await queryInterface.sequelize.query(`
      UPDATE conversations 
      SET response = message 
      WHERE message_by = 'assistant' AND message IS NOT NULL
    `);

    // Update chatbot_response for chatbot messages
    await queryInterface.sequelize.query(`
      UPDATE conversations 
      SET chatbot_response = chatbot_message 
      WHERE chatbot_message IS NOT NULL
    `);

    // Step 3: Migrate data from raw_data table to conversations
    await queryInterface.sequelize.query(`
      UPDATE conversations 
      SET 
        error = rd.error,
        status = rd.status,
        authkey_name = rd.authkey_name,
        latency = rd.latency,
        service = rd.service,
        input_tokens = rd.input_tokens,
        output_tokens = rd.output_tokens,
        expected_cost = rd.expected_cost,
        created_at = rd.created_at,
        variables = rd.variables,
        finish_reason = rd.finish_reason,
        model_name = rd.model_name,
        type = rd.type
      FROM raw_data rd 
      WHERE conversations.message_id = rd.message_id
    `);

    // Step 4: Drop old columns that are no longer needed
    await queryInterface.removeColumn('conversations', 'message');
    await queryInterface.removeColumn('conversations', 'message_by');
    await queryInterface.removeColumn('conversations', 'chatbot_message');
    await queryInterface.removeColumn('conversations', 'updated_message');

    // Step 5: Drop raw_data table
    await queryInterface.dropTable('raw_data');
  },

  async down (queryInterface, Sequelize) {
    // Recreate raw_data table
    await queryInterface.createTable('raw_data', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      org_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      authkey_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      latency: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      service: {
        type: Sequelize.STRING,
        allowNull: true
      },
      input_tokens: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      output_tokens: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      expected_cost: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      message_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      variables: {
        type: Sequelize.JSON,
        allowNull: true
      },
      finish_reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      model_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('chat', 'completion', 'embedding'),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Restore old columns to conversations table
    await queryInterface.addColumn('conversations', 'message', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'message_by', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'chatbot_message', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('conversations', 'updated_message', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Migrate data back from merged structure to separate tables
    // This is complex and may result in data loss - recommend backup before migration
    console.warn('WARNING: Rolling back this migration may result in data loss. Ensure you have a backup.');

    // Remove merged columns
    await queryInterface.removeColumn('conversations', 'user_message');
    await queryInterface.removeColumn('conversations', 'response');
    await queryInterface.removeColumn('conversations', 'chatbot_response');
    await queryInterface.removeColumn('conversations', 'response_id');
    await queryInterface.removeColumn('conversations', 'revised_response');
    await queryInterface.removeColumn('conversations', 'error');
    await queryInterface.removeColumn('conversations', 'status');
    await queryInterface.removeColumn('conversations', 'authkey_name');
    await queryInterface.removeColumn('conversations', 'latency');
    await queryInterface.removeColumn('conversations', 'service');
    await queryInterface.removeColumn('conversations', 'input_tokens');
    await queryInterface.removeColumn('conversations', 'output_tokens');
    await queryInterface.removeColumn('conversations', 'expected_cost');
    await queryInterface.removeColumn('conversations', 'created_at');
    await queryInterface.removeColumn('conversations', 'variables');
    await queryInterface.removeColumn('conversations', 'finish_reason');
    await queryInterface.removeColumn('conversations', 'model_name');
    await queryInterface.removeColumn('conversations', 'type');
  }
};
