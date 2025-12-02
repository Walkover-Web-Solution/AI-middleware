import metrics_sevice from "../db_services/metrics_services.js";
import { buildWhereClause, selectTable } from "../utils/metricsUtils.js"


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
  let start_date = new Date();
  let end_date = new Date();
  if (range === 10) {
    start_date = req.body.start_date;
    end_date = req.body.end_date;
  }
  const whereClause = buildWhereClause(params, values, factor, range, start_date, end_date);
  // const table = selectTable(startTime, endTime, range);
  const table = selectTable(range);
  const query = `SELECT ${factor}, created_at, SUM(cost_sum) as cost_sum, AVG(latency_sum/NULLIF(record_count, 0)) as latency_sum, SUM(success_count) as success_count, SUM(total_token_count) AS total_token_count FROM ${table} ${whereClause} ORDER BY created_at ASC`;

  const today_whereClause = buildWhereClause(params, values, factor, range, false, start_date, end_date);
  const today_query = `SELECT ${factor}, created_at, SUM(cost_sum) as cost_sum, AVG(latency_sum/NULLIF(record_count, 0)) as latency_sum, SUM(success_count) as success_count, SUM(total_token_count) AS total_token_count FROM fifteen_minute_data ${today_whereClause} ORDER BY created_at ASC`;
  try {
    const data = await metrics_sevice.find(query, values);
    const today_data = await metrics_sevice.find(today_query, values);
    if (range > 5) {
      res.status(200).json({
        statusCode: 200,
        data: [...data, ...today_data],
        message: 'Successfully get request data'
      });
    } else {
      res.status(200).json({
        statusCode: 200,
        data,
        message: 'Successfully get request data'
      });
    }
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

const bridge_metrics = async (req, res) => {
  try {
    const org_id = req.profile?.org?.id;
    const { start_date, end_date } = req.body;

    let query = `SELECT bridge_id, SUM(total_token_count) as total_tokens 
                     FROM daily_data 
                     WHERE org_id = :org_id`;

    const replacements = { org_id };

    if (start_date && end_date) {
      query += ` AND created_at BETWEEN :start_date AND :end_date`;
      replacements.start_date = start_date;
      replacements.end_date = end_date;
    } else {
      query += ` AND created_at >= NOW() - INTERVAL '24 hours'`;
    }

    query += ` GROUP BY bridge_id`;

    const data = await metrics_sevice.find(query, replacements);

    res.status(200).json({
      statusCode: 200,
      data,
      message: 'Successfully retrieved bridge metrics'
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

export {
  metrics_data,
  bridge_metrics
}