import combinedModels from "./../../models/index.js";
const timescale = combinedModels.timescale;
import Sequelize from "sequelize";
async function find(query, values) {
  try {
    const queryOptions = {
      type: Sequelize.QueryTypes.SELECT,
      replacements: values
    };
    const results = await timescale.sequelize.query(query, queryOptions);
    return results;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

export default {
  find
};
