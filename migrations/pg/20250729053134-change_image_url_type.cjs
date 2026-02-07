"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, add a temporary column to store array of JSON data
    await queryInterface.addColumn("conversations", "image_url_temp", {
      type: Sequelize.ARRAY(Sequelize.JSON),
      allowNull: true,
    });

    // Convert existing text data to array of JSON format
    // If image_url is not null and not empty, create JSON object with permanent_url
    await queryInterface.sequelize.query(`
      UPDATE conversations 
      SET image_url_temp = CASE 
        WHEN image_url IS NOT NULL AND image_url != '' THEN 
          ARRAY[json_build_object('revised_prompt', '', 'permanent_url', image_url)]
        ELSE ARRAY[]::json[]
      END
    `);

    // Drop the old column
    await queryInterface.removeColumn("conversations", "image_url");

    // Rename the temporary column to the original name
    await queryInterface.renameColumn("conversations", "image_url_temp", "image_urls");
  },

  async down(queryInterface, Sequelize) {
    // First, add a temporary column to store text data
    await queryInterface.addColumn("conversations", "image_url_temp", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Convert JSON array data back to text format (extract permanent_url from first element)
    await queryInterface.sequelize.query(`
      UPDATE conversations 
      SET image_url_temp = CASE 
        WHEN image_urls IS NOT NULL AND array_length(image_urls, 1) > 0 THEN 
          image_urls[1]->>'permanent_url'
        ELSE NULL
      END
    `);

    // Drop the JSON array column
    await queryInterface.removeColumn("conversations", "image_urls");

    // Rename the temporary column back to the original name
    await queryInterface.renameColumn("conversations", "image_url_temp", "image_url");
  },
};
