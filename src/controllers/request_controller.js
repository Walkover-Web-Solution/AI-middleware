import metrics_sevice from "../db_services/metrics_services.js";
const metrics = async (req, res) => {
  const {
    org_id
  } = req.params;
  const {
    startTime,
    endTime,
    page = 1,
    limit = 200
  } = req.query;
  const offset = (page - 1) * limit;
  try {
    const data = await metrics_sevice.find(org_id, startTime, endTime, limit, offset);
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
const getRequestData = async (req, res) => {
  const {
    id
  } = req.params;
  try {
    const data = await metrics_sevice.findOne(id);
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
const getRequestDataForPg = async (req, res) => {
  const {
    id
  } = req.params;
  try {
    const data = await metrics_sevice.findOnePg(id);
    res.status(200).json({
      statusCode: 200,
      data,
      message: 'Successfully get request data of Pg'
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
export {
  metrics,
  getRequestData,
  getRequestDataForPg
};