'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, add a temporary column to store array data
    await queryInterface.addColumn('conversations', 'image_url_temp', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: true
    });

    // Convert existing text data to array format
    // If image_url is not null and not empty, wrap it in an array
    await queryInterface.sequelize.query(`
      UPDATE conversations 
      SET image_url_temp = CASE 
        WHEN image_url IS NOT NULL AND image_url != '' THEN ARRAY[image_url]
        ELSE ARRAY[]::text[]
      END
    `);

    // Drop the old column
    await queryInterface.removeColumn('conversations', 'image_url');

    // Rename the temporary column to the original name
    await queryInterface.renameColumn('conversations', 'image_url_temp', 'image_urls');
  },

  async down (queryInterface, Sequelize) {
    // First, add a temporary column to store text data
    await queryInterface.addColumn('conversations', 'image_url_temp', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Convert array data back to text format (take first element)
    await queryInterface.sequelize.query(`
      UPDATE conversations 
      SET image_url_temp = CASE 
        WHEN image_url IS NOT NULL AND array_length(image_url, 1) > 0 THEN image_url[1]
        ELSE NULL
      END
    `);

    // Drop the array column
    await queryInterface.removeColumn('conversations', 'image_url');

    // Rename the temporary column back to the original name
    await queryInterface.renameColumn('conversations', 'image_url_temp', 'image_url');
  }
};
