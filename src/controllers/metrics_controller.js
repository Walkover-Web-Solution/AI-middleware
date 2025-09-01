import metrics_sevice from "../db_services/metrics_services.js";
import {buildWhereClause, selectTable, selectBucket} from "../utils/metricsUtils.js"


const metrics_data = async (req, res) => {
    const org_id = req.profile?.org?.id;
    const {
      startTime,
      endTime,
    } = req.query;
    const { apikey_id, service, model, thread_id, bridge_id, version_id, range, factor } = req.body;
    const values = [];
    const params = {
        org_id,
        bridge_id,
        version_id,
        apikey_id,
        thread_id,
        service,
        model,
        startTime,
        endTime,
      };
    const whereClause = buildWhereClause(params, values, factor, range);
    // const table = selectTable(startTime, endTime, range);
    const table = selectTable(range);
    const bucket = selectBucket(range);
    const query = `SELECT ${factor}, ${bucket}, SUM(cost_sum) as cost_sum, AVG(latency_sum/NULLIF(record_count, 0)) as latency_sum, SUM(success_count) as success_count, SUM(total_token_count) AS total_token_count FROM ${table} ${whereClause} ORDER BY created_at ASC`;
    try {
      const data = await metrics_sevice.find(query, values);
      res.status(200).json({
        statusCode: 200,
        data,
        message: 'Successfully get request data'
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  };

  export {
    metrics_data
  }