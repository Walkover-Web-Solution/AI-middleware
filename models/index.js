import db from "./postgres/index.js";
import timescaleDb from "./timescale/index.js";
const combinedModels = {
  pg: db,
  timescale:timescaleDb
  
};
export default combinedModels;
